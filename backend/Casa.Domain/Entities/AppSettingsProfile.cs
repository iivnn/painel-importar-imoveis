using Casa.Domain.Enums;

namespace Casa.Domain.Entities;

public class AppSettingsProfile
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;

    public PropertySource DefaultSource { get; set; } = PropertySource.AppExterno;

    public string DefaultCategory { get; set; } = "Apartamento";

    public string DefaultCity { get; set; } = "Sao Paulo";

    public string DefaultState { get; set; } = "SP";

    public bool DefaultHasExactLocation { get; set; } = true;

    public int ListingsPageSize { get; set; } = 10;

    public int FavoritesPageSize { get; set; } = 6;

    public string FavoritesSortBy { get; set; } = "Recent";

    public decimal MapInitialLatitude { get; set; } = -14.235m;

    public decimal MapInitialLongitude { get; set; } = -51.9253m;

    public int MapInitialZoom { get; set; } = 4;

    public bool MapOnlyExactLocation { get; set; }

    public decimal MonthlyBudgetIdeal { get; set; } = 2500m;

    public decimal MonthlyBudgetMax { get; set; } = 3500m;

    public string PreferredNeighborhoods { get; set; } = string.Empty;

    public string AvoidedNeighborhoods { get; set; } = string.Empty;

    public decimal PriceBelowAverageRatio { get; set; } = 0.72m;

    public decimal PriceAboveAverageRatio { get; set; } = 1.35m;

    public bool RequireCoordinatesForCompleteLocation { get; set; } = true;

    public bool RequireOriginalUrl { get; set; } = true;

    public int MinimumPhotoCount { get; set; } = 1;

    public string RequireSwotStatuses { get; set; } = "EmAnalise,Visitado,Proposta";

    public string RequireNotesStatuses { get; set; } = "Visitado,Proposta";

    public string RequireMediaStatuses { get; set; } = "Visitado,Proposta";

    public int PriceWeight { get; set; } = 30;

    public int LocationWeight { get; set; } = 25;

    public int AnalysisWeight { get; set; } = 20;

    public int EvidenceWeight { get; set; } = 15;

    public int SourceQualityWeight { get; set; } = 10;

    public AppLogLevel BackendMinimumLogLevel { get; set; } = AppLogLevel.Info;

    public AppLogLevel FrontendMinimumLogLevel { get; set; } = AppLogLevel.Warning;

    public AppLogLevel ExtensionMinimumLogLevel { get; set; } = AppLogLevel.Warning;

    public int InfoLogRetentionDays { get; set; } = 30;

    public int WarningLogRetentionDays { get; set; } = 45;

    public int ErrorLogRetentionDays { get; set; } = 90;

    public bool LogNavigationEvents { get; set; } = true;

    public bool LogFrontendHttpFailures { get; set; } = true;

    public bool LogRealtimeEvents { get; set; } = false;

    public bool LogExtensionExtractionEvents { get; set; } = true;

    public bool LogExtensionGeocodingEvents { get; set; } = true;

    public bool LogExtensionImageImportEvents { get; set; } = true;

    public bool AllowFrontendLogIngestion { get; set; } = true;

    public bool AllowExtensionLogIngestion { get; set; } = true;

    public int LogDetailsMaxLength { get; set; } = 4000;

    public bool LogAutoCleanupEnabled { get; set; } = true;
}
