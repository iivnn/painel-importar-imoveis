import { PropertySource, PropertySwotStatus } from '../../properties/models/create-property.model';
import { PropertyFavoriteSortBy } from '../../properties/models/property-favorites.model';
import { AppLogLevel } from '../../logs/models/app-log.model';

export interface AppSettings {
  defaultSource: PropertySource;
  defaultCategory: string;
  defaultCity: string;
  defaultState: string;
  defaultHasExactLocation: boolean;
  listingsPageSize: number;
  favoritesPageSize: number;
  favoritesSortBy: PropertyFavoriteSortBy;
  mapInitialLatitude: number;
  mapInitialLongitude: number;
  mapInitialZoom: number;
  mapOnlyExactLocation: boolean;
  monthlyBudgetIdeal: number;
  monthlyBudgetMax: number;
  preferredNeighborhoods: string[];
  avoidedNeighborhoods: string[];
  priceBelowAverageRatio: number;
  priceAboveAverageRatio: number;
  requireCoordinatesForCompleteLocation: boolean;
  requireOriginalUrl: boolean;
  minimumPhotoCount: number;
  requireSwotStatuses: PropertySwotStatus[];
  requireNotesStatuses: PropertySwotStatus[];
  requireMediaStatuses: PropertySwotStatus[];
  priceWeight: number;
  locationWeight: number;
  analysisWeight: number;
  evidenceWeight: number;
  sourceQualityWeight: number;
  backendMinimumLogLevel: AppLogLevel;
  frontendMinimumLogLevel: AppLogLevel;
  extensionMinimumLogLevel: AppLogLevel;
  infoLogRetentionDays: number;
  warningLogRetentionDays: number;
  errorLogRetentionDays: number;
  logNavigationEvents: boolean;
  logFrontendHttpFailures: boolean;
  logRealtimeEvents: boolean;
  logExtensionExtractionEvents: boolean;
  logExtensionGeocodingEvents: boolean;
  logExtensionImageImportEvents: boolean;
  allowFrontendLogIngestion: boolean;
  allowExtensionLogIngestion: boolean;
  logDetailsMaxLength: number;
  logAutoCleanupEnabled: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  defaultSource: 'AppExterno',
  defaultCategory: 'Apartamento',
  defaultCity: 'Sao Paulo',
  defaultState: 'SP',
  defaultHasExactLocation: true,
  listingsPageSize: 10,
  favoritesPageSize: 6,
  favoritesSortBy: 'Recent',
  mapInitialLatitude: -14.235,
  mapInitialLongitude: -51.9253,
  mapInitialZoom: 4,
  mapOnlyExactLocation: false,
  monthlyBudgetIdeal: 2500,
  monthlyBudgetMax: 3500,
  preferredNeighborhoods: [],
  avoidedNeighborhoods: [],
  priceBelowAverageRatio: 0.72,
  priceAboveAverageRatio: 1.35,
  requireCoordinatesForCompleteLocation: true,
  requireOriginalUrl: true,
  minimumPhotoCount: 1,
  requireSwotStatuses: ['EmAnalise', 'Visitado', 'Proposta'],
  requireNotesStatuses: ['Visitado', 'Proposta'],
  requireMediaStatuses: ['Visitado', 'Proposta'],
  priceWeight: 30,
  locationWeight: 25,
  analysisWeight: 20,
  evidenceWeight: 15,
  sourceQualityWeight: 10,
  backendMinimumLogLevel: 'Info',
  frontendMinimumLogLevel: 'Warning',
  extensionMinimumLogLevel: 'Warning',
  infoLogRetentionDays: 30,
  warningLogRetentionDays: 45,
  errorLogRetentionDays: 90,
  logNavigationEvents: true,
  logFrontendHttpFailures: true,
  logRealtimeEvents: false,
  logExtensionExtractionEvents: true,
  logExtensionGeocodingEvents: true,
  logExtensionImageImportEvents: true,
  allowFrontendLogIngestion: true,
  allowExtensionLogIngestion: true,
  logDetailsMaxLength: 4000,
  logAutoCleanupEnabled: true
};
