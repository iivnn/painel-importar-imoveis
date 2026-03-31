import { HttpBackend, HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable } from 'rxjs';

import {
  AppLogFilters,
  AppLogLevel,
  AppLogPage,
  AppLogSource,
  AppLogSummary,
  ClientLogRequest
} from '../../features/logs/models/app-log.model';

@Injectable({ providedIn: 'root' })
export class AppLogsService {
  private readonly http = inject(HttpClient);
  private readonly httpBackend = inject(HttpBackend);
  private readonly rawHttp = new HttpClient(this.httpBackend);
  private readonly apiBaseUrl = 'http://localhost:5074/api/logs';
  private readonly hubUrl = 'http://localhost:5074/hubs/logs';

  createConnection(): signalR.HubConnection {
    return new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, { withCredentials: false })
      .withAutomaticReconnect()
      .build();
  }

  getSummary(): Observable<AppLogSummary> {
    return this.http.get<AppLogSummary>(`${this.apiBaseUrl}/summary`);
  }

  getPage(page: number, pageSize: number, filters: AppLogFilters): Observable<AppLogPage> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    if (filters.source) {
      params = params.set('source', filters.source);
    }

    if (filters.level) {
      params = params.set('level', filters.level);
    }

    if (filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }

    return this.http.get<AppLogPage>(this.apiBaseUrl, { params });
  }

  clearAll(): Observable<void> {
    return this.http.delete<void>(this.apiBaseUrl);
  }

  logInfo(
    category: string,
    eventName: string,
    message: string,
    details?: unknown,
    metadata?: Partial<ClientLogRequest>
  ): void {
    this.logSilently({
      source: 'Frontend',
      level: 'Info',
      category,
      eventName,
      message,
      details,
      ...metadata
    });
  }

  logWarning(
    category: string,
    eventName: string,
    message: string,
    details?: unknown,
    metadata?: Partial<ClientLogRequest>
  ): void {
    this.logSilently({
      source: 'Frontend',
      level: 'Warning',
      category,
      eventName,
      message,
      details,
      ...metadata
    });
  }

  logError(
    category: string,
    eventName: string,
    message: string,
    details?: unknown,
    metadata?: Partial<ClientLogRequest>
  ): void {
    this.logSilently({
      source: 'Frontend',
      level: 'Error',
      category,
      eventName,
      message,
      details,
      ...metadata
    });
  }

  logSilently(request: ClientLogRequest): void {
    const normalizedRequest = this.normalizeRequest(request);

    this.rawHttp.post(`${this.apiBaseUrl}/ingest`, normalizedRequest).subscribe({
      error: () => {
        // Intencionalmente silencioso para nao gerar cascata de falhas de log.
      }
    });
  }

  private normalizeRequest(request: ClientLogRequest): ClientLogRequest {
    return {
      source: request.source || 'Frontend',
      level: request.level || 'Info',
      category: request.category || 'Frontend',
      eventName: request.eventName || 'UnknownEvent',
      message: request.message || 'Evento de frontend sem mensagem.',
      details: request.details ?? null,
      traceId: request.traceId || '',
      path: request.path || window.location.pathname,
      method: request.method || '',
      userAgent: request.userAgent || navigator.userAgent,
      relatedEntityType: request.relatedEntityType || '',
      relatedEntityId: request.relatedEntityId || '',
      createdAtUtc: request.createdAtUtc || new Date().toISOString()
    };
  }
}

export function readLogTraceId(errorBody: unknown): string {
  if (typeof errorBody !== 'object' || errorBody === null) {
    return '';
  }

  const traceId = (errorBody as { traceId?: unknown }).traceId;
  return typeof traceId === 'string' ? traceId : '';
}

export function isLogEndpoint(url: string): boolean {
  return url.includes('/api/logs');
}

export function normalizeLogLevelFromStatus(status: number): AppLogLevel {
  return status >= 500 ? 'Error' : 'Warning';
}

export function normalizeLogSource(value: string): AppLogSource | '' {
  return value === 'Backend' || value === 'Frontend' || value === 'Extension'
    ? value
    : '';
}
