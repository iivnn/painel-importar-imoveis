import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PropertyListingPage } from './property-listing.model';

@Injectable({ providedIn: 'root' })
export class PropertyListingsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:5074/api/properties';

  getPage(page: number, pageSize: number): Observable<PropertyListingPage> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    return this.http.get<PropertyListingPage>(this.apiBaseUrl, { params });
  }
}
