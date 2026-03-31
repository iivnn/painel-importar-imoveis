using Casa.Domain.Entities;

namespace Casa.Application.Settings;

internal static class AppSettingsMapper
{
    public static AppSettingsResponse Map(AppSettingsProfile profile)
    {
        return new AppSettingsResponse
        {
            DefaultSource = profile.DefaultSource,
            DefaultCategory = profile.DefaultCategory,
            DefaultCity = profile.DefaultCity,
            DefaultState = profile.DefaultState,
            DefaultHasExactLocation = profile.DefaultHasExactLocation,
            ListingsPageSize = profile.ListingsPageSize,
            FavoritesPageSize = profile.FavoritesPageSize,
            FavoritesSortBy = profile.FavoritesSortBy,
            MapInitialLatitude = profile.MapInitialLatitude,
            MapInitialLongitude = profile.MapInitialLongitude,
            MapInitialZoom = profile.MapInitialZoom,
            MapOnlyExactLocation = profile.MapOnlyExactLocation,
            MonthlyBudgetIdeal = profile.MonthlyBudgetIdeal,
            MonthlyBudgetMax = profile.MonthlyBudgetMax,
            PreferredNeighborhoods = Split(profile.PreferredNeighborhoods),
            AvoidedNeighborhoods = Split(profile.AvoidedNeighborhoods),
            PriceBelowAverageRatio = profile.PriceBelowAverageRatio,
            PriceAboveAverageRatio = profile.PriceAboveAverageRatio,
            RequireCoordinatesForCompleteLocation = profile.RequireCoordinatesForCompleteLocation,
            RequireOriginalUrl = profile.RequireOriginalUrl,
            MinimumPhotoCount = profile.MinimumPhotoCount,
            RequireSwotStatuses = Split(profile.RequireSwotStatuses),
            RequireNotesStatuses = Split(profile.RequireNotesStatuses),
            RequireMediaStatuses = Split(profile.RequireMediaStatuses),
            PriceWeight = profile.PriceWeight,
            LocationWeight = profile.LocationWeight,
            AnalysisWeight = profile.AnalysisWeight,
            EvidenceWeight = profile.EvidenceWeight,
            SourceQualityWeight = profile.SourceQualityWeight,
            BackendMinimumLogLevel = profile.BackendMinimumLogLevel,
            FrontendMinimumLogLevel = profile.FrontendMinimumLogLevel,
            ExtensionMinimumLogLevel = profile.ExtensionMinimumLogLevel,
            InfoLogRetentionDays = profile.InfoLogRetentionDays,
            WarningLogRetentionDays = profile.WarningLogRetentionDays,
            ErrorLogRetentionDays = profile.ErrorLogRetentionDays,
            LogNavigationEvents = profile.LogNavigationEvents,
            LogFrontendHttpFailures = profile.LogFrontendHttpFailures,
            LogRealtimeEvents = profile.LogRealtimeEvents,
            LogExtensionExtractionEvents = profile.LogExtensionExtractionEvents,
            LogExtensionGeocodingEvents = profile.LogExtensionGeocodingEvents,
            LogExtensionImageImportEvents = profile.LogExtensionImageImportEvents,
            AllowFrontendLogIngestion = profile.AllowFrontendLogIngestion,
            AllowExtensionLogIngestion = profile.AllowExtensionLogIngestion,
            LogDetailsMaxLength = profile.LogDetailsMaxLength,
            LogAutoCleanupEnabled = profile.LogAutoCleanupEnabled
        };
    }

    public static void Apply(UpdateAppSettingsRequest request, AppSettingsProfile profile)
    {
        profile.DefaultSource = request.DefaultSource;
        profile.DefaultCategory = request.DefaultCategory.Trim();
        profile.DefaultCity = request.DefaultCity.Trim();
        profile.DefaultState = request.DefaultState.Trim().ToUpperInvariant();
        profile.DefaultHasExactLocation = request.DefaultHasExactLocation;
        profile.ListingsPageSize = Clamp(request.ListingsPageSize, 5, 50, 10);
        profile.FavoritesPageSize = Clamp(request.FavoritesPageSize, 3, 24, 6);
        profile.FavoritesSortBy = string.IsNullOrWhiteSpace(request.FavoritesSortBy) ? "Recent" : request.FavoritesSortBy.Trim();
        profile.MapInitialLatitude = request.MapInitialLatitude;
        profile.MapInitialLongitude = request.MapInitialLongitude;
        profile.MapInitialZoom = Clamp(request.MapInitialZoom, 3, 18, 4);
        profile.MapOnlyExactLocation = request.MapOnlyExactLocation;
        profile.MonthlyBudgetIdeal = request.MonthlyBudgetIdeal <= 0 ? 2500 : request.MonthlyBudgetIdeal;
        profile.MonthlyBudgetMax = request.MonthlyBudgetMax <= 0 ? 3500 : request.MonthlyBudgetMax;
        profile.PreferredNeighborhoods = Join(request.PreferredNeighborhoods);
        profile.AvoidedNeighborhoods = Join(request.AvoidedNeighborhoods);
        profile.PriceBelowAverageRatio = Clamp(request.PriceBelowAverageRatio, 0.4m, 0.95m, 0.72m);
        profile.PriceAboveAverageRatio = Clamp(request.PriceAboveAverageRatio, 1.05m, 2.5m, 1.35m);
        profile.RequireCoordinatesForCompleteLocation = request.RequireCoordinatesForCompleteLocation;
        profile.RequireOriginalUrl = request.RequireOriginalUrl;
        profile.MinimumPhotoCount = Clamp(request.MinimumPhotoCount, 0, 20, 1);
        profile.RequireSwotStatuses = Join(request.RequireSwotStatuses);
        profile.RequireNotesStatuses = Join(request.RequireNotesStatuses);
        profile.RequireMediaStatuses = Join(request.RequireMediaStatuses);
        profile.PriceWeight = Clamp(request.PriceWeight, 0, 100, 30);
        profile.LocationWeight = Clamp(request.LocationWeight, 0, 100, 25);
        profile.AnalysisWeight = Clamp(request.AnalysisWeight, 0, 100, 20);
        profile.EvidenceWeight = Clamp(request.EvidenceWeight, 0, 100, 15);
        profile.SourceQualityWeight = Clamp(request.SourceQualityWeight, 0, 100, 10);
        profile.BackendMinimumLogLevel = request.BackendMinimumLogLevel;
        profile.FrontendMinimumLogLevel = request.FrontendMinimumLogLevel;
        profile.ExtensionMinimumLogLevel = request.ExtensionMinimumLogLevel;
        profile.InfoLogRetentionDays = Clamp(request.InfoLogRetentionDays, 1, 365, 30);
        profile.WarningLogRetentionDays = Clamp(request.WarningLogRetentionDays, 1, 365, 45);
        profile.ErrorLogRetentionDays = Clamp(request.ErrorLogRetentionDays, 1, 365, 90);
        profile.LogNavigationEvents = request.LogNavigationEvents;
        profile.LogFrontendHttpFailures = request.LogFrontendHttpFailures;
        profile.LogRealtimeEvents = request.LogRealtimeEvents;
        profile.LogExtensionExtractionEvents = request.LogExtensionExtractionEvents;
        profile.LogExtensionGeocodingEvents = request.LogExtensionGeocodingEvents;
        profile.LogExtensionImageImportEvents = request.LogExtensionImageImportEvents;
        profile.AllowFrontendLogIngestion = request.AllowFrontendLogIngestion;
        profile.AllowExtensionLogIngestion = request.AllowExtensionLogIngestion;
        profile.LogDetailsMaxLength = Clamp(request.LogDetailsMaxLength, 500, 12000, 4000);
        profile.LogAutoCleanupEnabled = request.LogAutoCleanupEnabled;
    }

    private static int Clamp(int value, int min, int max, int fallback)
    {
        if (value == 0)
        {
            return fallback;
        }

        return Math.Min(Math.Max(value, min), max);
    }

    private static decimal Clamp(decimal value, decimal min, decimal max, decimal fallback)
    {
        if (value == 0)
        {
            return fallback;
        }

        return Math.Min(Math.Max(value, min), max);
    }

    private static string[] Split(string value)
    {
        return value
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static string Join(IEnumerable<string> values)
    {
        return string.Join(
            ',',
            values
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase));
    }
}
