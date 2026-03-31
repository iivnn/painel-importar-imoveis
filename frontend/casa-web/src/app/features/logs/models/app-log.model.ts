export type AppLogSource = 'Backend' | 'Frontend' | 'Extension';
export type AppLogLevel = 'Info' | 'Warning' | 'Error';

export interface AppLogItem {
  id: number;
  source: AppLogSource;
  level: AppLogLevel;
  category: string;
  eventName: string;
  message: string;
  detailsJson: string;
  traceId: string;
  path: string;
  method: string;
  userAgent: string;
  relatedEntityType: string;
  relatedEntityId: string;
  createdAtUtc: string;
}

export interface AppLogPage {
  items: AppLogItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AppLogSummary {
  totalItems: number;
  infoCount: number;
  warningCount: number;
  errorCount: number;
  backendCount: number;
  frontendCount: number;
  extensionCount: number;
  latestCreatedAtUtc: string | null;
}

export interface AppLogFilters {
  source: AppLogSource | '';
  level: AppLogLevel | '';
  search: string;
}

export interface ClientLogRequest {
  source: AppLogSource;
  level: AppLogLevel;
  category: string;
  eventName: string;
  message: string;
  details?: unknown;
  traceId?: string;
  path?: string;
  method?: string;
  userAgent?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAtUtc?: string;
}

export const EMPTY_APP_LOG_FILTERS: AppLogFilters = {
  source: '',
  level: '',
  search: ''
};
