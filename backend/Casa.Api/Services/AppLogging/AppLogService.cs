using System.Text.Json;
using System.Text.Json.Serialization;
using Casa.Application.Abstractions;
using Casa.Api.Hubs;
using Casa.Domain.Entities;
using Casa.Domain.Enums;
using Casa.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Casa.Api.Services.AppLogging;

public class AppLogService(
    CasaDbContext dbContext,
    IAppSettingsRepository appSettingsRepository,
    IHubContext<AppLogsHub> hubContext,
    ILogger<AppLogService> logger)
{
    private static readonly JsonSerializerOptions DetailsSerializerOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true,
        ReferenceHandler = ReferenceHandler.IgnoreCycles
    };

    public async Task<AppLogEntry> LogAsync(AppLogWriteModel model, CancellationToken cancellationToken = default)
    {
        var settings = await appSettingsRepository.GetAsync(cancellationToken);
        if (!ShouldPersist(model, settings))
        {
            return CreateSkippedEntry(model, settings.LogDetailsMaxLength);
        }

        var entry = new AppLogEntry
        {
            Source = model.Source,
            Level = model.Level,
            Category = NormalizeRequired(model.Category, "General", 80),
            EventName = NormalizeRequired(model.EventName, "Uncategorized", 120),
            Message = NormalizeRequired(model.Message, "Sem mensagem.", 2000),
            DetailsJson = NormalizeOptional(model.DetailsJson, settings.LogDetailsMaxLength),
            TraceId = NormalizeOptional(model.TraceId, 120),
            Path = NormalizeOptional(model.Path, 500),
            Method = NormalizeOptional(model.Method, 20),
            UserAgent = NormalizeOptional(model.UserAgent, 512),
            RelatedEntityType = NormalizeOptional(model.RelatedEntityType, 80),
            RelatedEntityId = NormalizeOptional(model.RelatedEntityId, 80),
            CreatedAtUtc = model.CreatedAtUtc ?? DateTimeOffset.UtcNow
        };

        dbContext.AppLogEntries.Add(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
        await PublishRealtimeAsync(cancellationToken);

        return entry;
    }

    public Task<AppLogEntry> LogInfoAsync(
        string category,
        string eventName,
        string message,
        object? details = null,
        string? traceId = null,
        string? path = null,
        string? method = null,
        string? relatedEntityType = null,
        string? relatedEntityId = null,
        CancellationToken cancellationToken = default)
    {
        return LogAsync(new AppLogWriteModel
        {
            Source = AppLogSource.Backend,
            Level = AppLogLevel.Info,
            Category = category,
            EventName = eventName,
            Message = message,
            DetailsJson = SerializeDetails(details),
            TraceId = traceId ?? string.Empty,
            Path = path ?? string.Empty,
            Method = method ?? string.Empty,
            RelatedEntityType = relatedEntityType ?? string.Empty,
            RelatedEntityId = relatedEntityId ?? string.Empty
        }, cancellationToken);
    }

    public Task<AppLogEntry> LogWarningAsync(
        string category,
        string eventName,
        string message,
        object? details = null,
        string? traceId = null,
        string? path = null,
        string? method = null,
        string? relatedEntityType = null,
        string? relatedEntityId = null,
        CancellationToken cancellationToken = default)
    {
        return LogAsync(new AppLogWriteModel
        {
            Source = AppLogSource.Backend,
            Level = AppLogLevel.Warning,
            Category = category,
            EventName = eventName,
            Message = message,
            DetailsJson = SerializeDetails(details),
            TraceId = traceId ?? string.Empty,
            Path = path ?? string.Empty,
            Method = method ?? string.Empty,
            RelatedEntityType = relatedEntityType ?? string.Empty,
            RelatedEntityId = relatedEntityId ?? string.Empty
        }, cancellationToken);
    }

    public Task<AppLogEntry> LogErrorAsync(
        string category,
        string eventName,
        string message,
        object? details = null,
        string? traceId = null,
        string? path = null,
        string? method = null,
        string? relatedEntityType = null,
        string? relatedEntityId = null,
        CancellationToken cancellationToken = default)
    {
        return LogAsync(new AppLogWriteModel
        {
            Source = AppLogSource.Backend,
            Level = AppLogLevel.Error,
            Category = category,
            EventName = eventName,
            Message = message,
            DetailsJson = SerializeDetails(details),
            TraceId = traceId ?? string.Empty,
            Path = path ?? string.Empty,
            Method = method ?? string.Empty,
            RelatedEntityType = relatedEntityType ?? string.Empty,
            RelatedEntityId = relatedEntityId ?? string.Empty
        }, cancellationToken);
    }

    public async Task<AppLogPageResponse> GetPageAsync(
        int page,
        int pageSize,
        AppLogSource? source,
        AppLogLevel? level,
        string? search,
        CancellationToken cancellationToken = default)
    {
        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 10, 100);
        var query = dbContext.AppLogEntries.AsNoTracking().AsQueryable();

        if (source.HasValue)
        {
            query = query.Where(entry => entry.Source == source.Value);
        }

        if (level.HasValue)
        {
            query = query.Where(entry => entry.Level == level.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim();
            query = query.Where(entry =>
                EF.Functions.Like(entry.Category, $"%{normalizedSearch}%") ||
                EF.Functions.Like(entry.EventName, $"%{normalizedSearch}%") ||
                EF.Functions.Like(entry.Message, $"%{normalizedSearch}%") ||
                EF.Functions.Like(entry.DetailsJson, $"%{normalizedSearch}%") ||
                EF.Functions.Like(entry.Path, $"%{normalizedSearch}%"));
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(entry => entry.Id)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(entry => new AppLogListItemResponse(
                entry.Id,
                entry.Source,
                entry.Level,
                entry.Category,
                entry.EventName,
                entry.Message,
                entry.DetailsJson,
                entry.TraceId,
                entry.Path,
                entry.Method,
                entry.UserAgent,
                entry.RelatedEntityType,
                entry.RelatedEntityId,
                entry.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)safePageSize);

        return new AppLogPageResponse(items, safePage, safePageSize, totalItems, totalPages);
    }

    public async Task<AppLogSummaryResponse> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        var query = dbContext.AppLogEntries.AsNoTracking();

        var totalItems = await query.CountAsync(cancellationToken);
        var infoCount = await query.CountAsync(entry => entry.Level == AppLogLevel.Info, cancellationToken);
        var warningCount = await query.CountAsync(entry => entry.Level == AppLogLevel.Warning, cancellationToken);
        var errorCount = await query.CountAsync(entry => entry.Level == AppLogLevel.Error, cancellationToken);
        var backendCount = await query.CountAsync(entry => entry.Source == AppLogSource.Backend, cancellationToken);
        var frontendCount = await query.CountAsync(entry => entry.Source == AppLogSource.Frontend, cancellationToken);
        var extensionCount = await query.CountAsync(entry => entry.Source == AppLogSource.Extension, cancellationToken);
        var latestCreatedAtUtc = await query
            .OrderByDescending(entry => entry.Id)
            .Select(entry => (DateTimeOffset?)entry.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        return new AppLogSummaryResponse(
            totalItems,
            infoCount,
            warningCount,
            errorCount,
            backendCount,
            frontendCount,
            extensionCount,
            latestCreatedAtUtc);
    }

    public async Task ClearAllAsync(CancellationToken cancellationToken = default)
    {
        await dbContext.Database.ExecuteSqlRawAsync("""DELETE FROM "AppLogEntries";""", cancellationToken);
        await PublishRealtimeAsync(cancellationToken);
    }

    public async Task SafeLogAsync(Func<Task> action, string fallbackMessage)
    {
        try
        {
            await action();
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "{Message}", fallbackMessage);
        }
    }

    private async Task PublishRealtimeAsync(CancellationToken cancellationToken)
    {
        var summary = await GetSummaryAsync(cancellationToken);
        await hubContext.Clients.All.SendAsync("logsSummaryUpdated", summary, cancellationToken);
        await hubContext.Clients.All.SendAsync("logsChanged", cancellationToken);
    }

    private static string SerializeDetails(object? details)
    {
        if (details is null)
        {
            return string.Empty;
        }

        try
        {
            return details switch
            {
                string text => NormalizeOptional(text, 12000),
                JsonDocument document => NormalizeOptional(document.RootElement.GetRawText(), 12000),
                JsonElement element => NormalizeOptional(element.GetRawText(), 12000),
                _ => NormalizeOptional(JsonSerializer.Serialize(details, DetailsSerializerOptions), 12000)
            };
        }
        catch (Exception exception)
        {
            var fallback = new
            {
                serializationError = exception.Message,
                detailType = details.GetType().FullName,
                detailText = details.ToString()
            };

            return NormalizeOptional(JsonSerializer.Serialize(fallback, DetailsSerializerOptions), 12000);
        }
    }

    private static string NormalizeRequired(string? value, string fallback, int maxLength)
    {
        return string.IsNullOrWhiteSpace(value)
            ? fallback
            : NormalizeOptional(value, maxLength);
    }

    private static string NormalizeOptional(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.Trim();
        return normalized.Length <= maxLength
            ? normalized
            : normalized[..maxLength];
    }

    private static bool ShouldPersist(AppLogWriteModel model, AppSettingsProfile settings)
    {
        if (!IsAllowedBySource(model.Source, settings))
        {
            return false;
        }

        if (!MeetsMinimumLevel(model.Source, model.Level, settings))
        {
            return false;
        }

        return IsAllowedByCategory(model.Source, model.Category, model.EventName, settings);
    }

    private static bool IsAllowedBySource(AppLogSource source, AppSettingsProfile settings)
    {
        return source switch
        {
            AppLogSource.Frontend => settings.AllowFrontendLogIngestion,
            AppLogSource.Extension => settings.AllowExtensionLogIngestion,
            _ => true
        };
    }

    private static bool MeetsMinimumLevel(AppLogSource source, AppLogLevel level, AppSettingsProfile settings)
    {
        var minimumLevel = source switch
        {
            AppLogSource.Backend => settings.BackendMinimumLogLevel,
            AppLogSource.Frontend => settings.FrontendMinimumLogLevel,
            AppLogSource.Extension => settings.ExtensionMinimumLogLevel,
            _ => AppLogLevel.Info
        };

        return level >= minimumLevel;
    }

    private static bool IsAllowedByCategory(
        AppLogSource source,
        string? category,
        string? eventName,
        AppSettingsProfile settings)
    {
        var normalizedCategory = (category ?? string.Empty).Trim();
        var normalizedEventName = (eventName ?? string.Empty).Trim();

        if (source == AppLogSource.Frontend)
        {
            if (normalizedCategory.Equals("Navigation", StringComparison.OrdinalIgnoreCase))
            {
                return settings.LogNavigationEvents;
            }

            if (normalizedCategory.Equals("Http", StringComparison.OrdinalIgnoreCase))
            {
                return settings.LogFrontendHttpFailures;
            }

            if (normalizedCategory.Equals("Realtime", StringComparison.OrdinalIgnoreCase))
            {
                return settings.LogRealtimeEvents;
            }
        }

        if (source == AppLogSource.Extension)
        {
            if (normalizedCategory.Equals("Extracao", StringComparison.OrdinalIgnoreCase))
            {
                return settings.LogExtensionExtractionEvents;
            }

            if (normalizedCategory.Equals("Geocodificacao", StringComparison.OrdinalIgnoreCase))
            {
                return settings.LogExtensionGeocodingEvents;
            }

            if (normalizedCategory.Equals("Importacao", StringComparison.OrdinalIgnoreCase)
                && normalizedEventName.Contains("Image", StringComparison.OrdinalIgnoreCase))
            {
                return settings.LogExtensionImageImportEvents;
            }
        }

        return true;
    }

    private static AppLogEntry CreateSkippedEntry(AppLogWriteModel model, int detailsMaxLength)
    {
        return new AppLogEntry
        {
            Id = 0,
            Source = model.Source,
            Level = model.Level,
            Category = NormalizeRequired(model.Category, "General", 80),
            EventName = NormalizeRequired(model.EventName, "Skipped", 120),
            Message = NormalizeRequired(model.Message, "Log filtrado.", 2000),
            DetailsJson = NormalizeOptional(model.DetailsJson, detailsMaxLength),
            TraceId = NormalizeOptional(model.TraceId, 120),
            Path = NormalizeOptional(model.Path, 500),
            Method = NormalizeOptional(model.Method, 20),
            UserAgent = NormalizeOptional(model.UserAgent, 512),
            RelatedEntityType = NormalizeOptional(model.RelatedEntityType, 80),
            RelatedEntityId = NormalizeOptional(model.RelatedEntityId, 80),
            CreatedAtUtc = model.CreatedAtUtc ?? DateTimeOffset.UtcNow
        };
    }
}

public sealed class AppLogWriteModel
{
    public AppLogSource Source { get; init; } = AppLogSource.Backend;
    public AppLogLevel Level { get; init; } = AppLogLevel.Info;
    public string Category { get; init; } = string.Empty;
    public string EventName { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public string DetailsJson { get; init; } = string.Empty;
    public string TraceId { get; init; } = string.Empty;
    public string Path { get; init; } = string.Empty;
    public string Method { get; init; } = string.Empty;
    public string UserAgent { get; init; } = string.Empty;
    public string RelatedEntityType { get; init; } = string.Empty;
    public string RelatedEntityId { get; init; } = string.Empty;
    public DateTimeOffset? CreatedAtUtc { get; init; }
}

public sealed record AppLogListItemResponse(
    long Id,
    AppLogSource Source,
    AppLogLevel Level,
    string Category,
    string EventName,
    string Message,
    string DetailsJson,
    string TraceId,
    string Path,
    string Method,
    string UserAgent,
    string RelatedEntityType,
    string RelatedEntityId,
    DateTimeOffset CreatedAtUtc);

public sealed record AppLogPageResponse(
    IReadOnlyList<AppLogListItemResponse> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages);

public sealed record AppLogSummaryResponse(
    int TotalItems,
    int InfoCount,
    int WarningCount,
    int ErrorCount,
    int BackendCount,
    int FrontendCount,
    int ExtensionCount,
    DateTimeOffset? LatestCreatedAtUtc);
