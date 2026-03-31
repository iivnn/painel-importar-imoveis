using System.Text.Json;
using Casa.Api.Hubs;
using Casa.Api.Services.AppLogging;
using Casa.Domain.Enums;

namespace Casa.Api.Endpoints;

public static class LogEndpoints
{
    public static IEndpointRouteBuilder MapLogEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/logs", async (
            int? page,
            int? pageSize,
            AppLogSource? source,
            AppLogLevel? level,
            string? search,
            AppLogService appLogService,
            CancellationToken cancellationToken) =>
        {
            var response = await appLogService.GetPageAsync(
                page ?? 1,
                pageSize ?? 20,
                source,
                level,
                search,
                cancellationToken);

            return Results.Ok(response);
        })
        .WithName("GetAppLogs")
        .WithOpenApi();

        endpoints.MapGet("/api/logs/summary", async (
            AppLogService appLogService,
            CancellationToken cancellationToken) =>
        {
            var response = await appLogService.GetSummaryAsync(cancellationToken);
            return Results.Ok(response);
        })
        .WithName("GetAppLogsSummary")
        .WithOpenApi();

        endpoints.MapPost("/api/logs/ingest", async (
            LogIngestRequest request,
            HttpContext httpContext,
            AppLogService appLogService,
            CancellationToken cancellationToken) =>
        {
            await appLogService.LogAsync(new AppLogWriteModel
            {
                Source = request.Source,
                Level = request.Level,
                Category = request.Category,
                EventName = request.EventName,
                Message = request.Message,
                DetailsJson = request.Details.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null
                    ? string.Empty
                    : request.Details.GetRawText(),
                TraceId = string.IsNullOrWhiteSpace(request.TraceId) ? httpContext.TraceIdentifier : request.TraceId,
                Path = request.Path,
                Method = request.Method,
                UserAgent = string.IsNullOrWhiteSpace(request.UserAgent)
                    ? httpContext.Request.Headers.UserAgent.ToString()
                    : request.UserAgent,
                RelatedEntityType = request.RelatedEntityType,
                RelatedEntityId = request.RelatedEntityId,
                CreatedAtUtc = request.CreatedAtUtc
            }, cancellationToken);

            return Results.Accepted();
        })
        .WithName("IngestAppLog")
        .WithOpenApi();

        endpoints.MapDelete("/api/logs", async (
            AppLogService appLogService,
            CancellationToken cancellationToken) =>
        {
            await appLogService.ClearAllAsync(cancellationToken);
            return Results.NoContent();
        })
        .WithName("ClearAppLogs")
        .WithOpenApi();

        endpoints.MapHub<AppLogsHub>("/hubs/logs");

        return endpoints;
    }
}

public sealed class LogIngestRequest
{
    public AppLogSource Source { get; init; } = AppLogSource.Frontend;
    public AppLogLevel Level { get; init; } = AppLogLevel.Info;
    public string Category { get; init; } = string.Empty;
    public string EventName { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public JsonElement Details { get; init; }
    public string TraceId { get; init; } = string.Empty;
    public string Path { get; init; } = string.Empty;
    public string Method { get; init; } = string.Empty;
    public string UserAgent { get; init; } = string.Empty;
    public string RelatedEntityType { get; init; } = string.Empty;
    public string RelatedEntityId { get; init; } = string.Empty;
    public DateTimeOffset? CreatedAtUtc { get; init; }
}
