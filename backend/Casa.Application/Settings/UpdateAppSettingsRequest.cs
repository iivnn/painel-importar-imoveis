using Casa.Domain.Enums;

namespace Casa.Application.Settings;

public class UpdateAppSettingsRequest
{
    public PropertySource DefaultSource { get; set; }

    public string DefaultCategory { get; set; } = string.Empty;

    public string DefaultCity { get; set; } = string.Empty;

    public string DefaultState { get; set; } = string.Empty;

    public bool DefaultHasExactLocation { get; set; }

    public int ListingsPageSize { get; set; }

    public int FavoritesPageSize { get; set; }

    public string FavoritesSortBy { get; set; } = "Recent";

    public decimal MapInitialLatitude { get; set; }

    public decimal MapInitialLongitude { get; set; }

    public int MapInitialZoom { get; set; }

    public bool MapOnlyExactLocation { get; set; }

    public decimal MonthlyBudgetIdeal { get; set; }

    public decimal MonthlyBudgetMax { get; set; }

    public string[] PreferredNeighborhoods { get; set; } = [];

    public string[] AvoidedNeighborhoods { get; set; } = [];

    public decimal PriceBelowAverageRatio { get; set; }

    public decimal PriceAboveAverageRatio { get; set; }

    public bool RequireCoordinatesForCompleteLocation { get; set; }

    public bool RequireOriginalUrl { get; set; }

    public int MinimumPhotoCount { get; set; }

    public string[] RequireSwotStatuses { get; set; } = [];

    public string[] RequireNotesStatuses { get; set; } = [];

    public string[] RequireMediaStatuses { get; set; } = [];

    public int PriceWeight { get; set; }

    public int LocationWeight { get; set; }

    public int AnalysisWeight { get; set; }

    public int EvidenceWeight { get; set; }

    public int SourceQualityWeight { get; set; }

    public AppLogLevel BackendMinimumLogLevel { get; set; }

    public AppLogLevel FrontendMinimumLogLevel { get; set; }

    public AppLogLevel ExtensionMinimumLogLevel { get; set; }

    public int InfoLogRetentionDays { get; set; }

    public int WarningLogRetentionDays { get; set; }

    public int ErrorLogRetentionDays { get; set; }

    public bool LogNavigationEvents { get; set; }

    public bool LogFrontendHttpFailures { get; set; }

    public bool LogRealtimeEvents { get; set; }

    public bool LogExtensionExtractionEvents { get; set; }

    public bool LogExtensionGeocodingEvents { get; set; }

    public bool LogExtensionImageImportEvents { get; set; }

    public bool AllowFrontendLogIngestion { get; set; }

    public bool AllowExtensionLogIngestion { get; set; }

    public int LogDetailsMaxLength { get; set; }

    public bool LogAutoCleanupEnabled { get; set; }
}
