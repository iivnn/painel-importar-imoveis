import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AppSettings } from '../../features/settings/models/app-settings.model';

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5074/api/settings';

  getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(this.apiUrl);
  }

  updateSettings(request: AppSettings): Observable<AppSettings> {
    return this.http.put<AppSettings>(this.apiUrl, request);
  }
}
