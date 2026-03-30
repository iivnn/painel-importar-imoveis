import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { Observable } from 'rxjs';

import {
  PropertyInconsistenciesResponse,
  PropertyInconsistencySummary
} from '../../features/properties/models/property-inconsistency.model';

@Injectable({ providedIn: 'root' })
export class PropertyInconsistenciesService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:5074/api/properties/inconsistencies';
  private readonly hubUrl = 'http://localhost:5074/hubs/inconsistencies';

  createConnection(): signalR.HubConnection {
    return new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, { withCredentials: false })
      .withAutomaticReconnect()
      .build();
  }

  getSummary(): Observable<PropertyInconsistencySummary> {
    return this.http.get<PropertyInconsistencySummary>(`${this.apiBaseUrl}/summary`);
  }

  getAll(): Observable<PropertyInconsistenciesResponse> {
    return this.http.get<PropertyInconsistenciesResponse>(this.apiBaseUrl);
  }

  dismiss(inconsistencyId: string): Observable<void> {
    return this.http.put<void>(`${this.apiBaseUrl}/${encodeURIComponent(inconsistencyId)}/dismiss`, {});
  }
}
