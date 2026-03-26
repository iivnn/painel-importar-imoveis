import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CreatePropertyRequest } from './create-property.model';
import { PropertyFilterOptions, PropertyFilters } from './property-filters.model';
import { PropertyListing, PropertyListingPage } from './property-listing.model';
import { PropertySwotAnalysis, SavePropertySwotRequest } from './property-swot.model';
import { PropertySwotStatus } from './create-property.model';

@Injectable({ providedIn: 'root' })
export class PropertyListingsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:5074/api/properties';

  getPage(page: number, pageSize: number, filters: PropertyFilters): Observable<PropertyListingPage> {
    const params = this.appendFilters(new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize), filters);

    return this.http.get<PropertyListingPage>(this.apiBaseUrl, { params });
  }

  getMapItems(filters: PropertyFilters): Observable<PropertyListing[]> {
    const params = this.appendFilters(new HttpParams(), filters);

    return this.http.get<PropertyListing[]>(`${this.apiBaseUrl}/map`, { params });
  }

  getFilterOptions(): Observable<PropertyFilterOptions> {
    return this.http.get<PropertyFilterOptions>(`${this.apiBaseUrl}/filter-options`);
  }

  softDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/${id}`);
  }

  create(request: CreatePropertyRequest): Observable<void> {
    return this.http.post<void>(this.apiBaseUrl, request);
  }

  getSwot(id: number): Observable<PropertySwotAnalysis> {
    return this.http.get<PropertySwotAnalysis>(`${this.apiBaseUrl}/${id}/swot`);
  }

  saveSwot(id: number, request: SavePropertySwotRequest): Observable<PropertySwotAnalysis> {
    return this.http.put<PropertySwotAnalysis>(`${this.apiBaseUrl}/${id}/swot`, request);
  }

  updateStatus(id: number, swotStatus: PropertySwotStatus): Observable<PropertyListing> {
    return this.http.put<PropertyListing>(`${this.apiBaseUrl}/${id}/status`, { swotStatus });
  }

  private appendFilters(params: HttpParams, filters: PropertyFilters): HttpParams {
    let nextParams = params;

    if (filters.minPrice !== null) {
      nextParams = nextParams.set('minPrice', filters.minPrice);
    }

    if (filters.maxPrice !== null) {
      nextParams = nextParams.set('maxPrice', filters.maxPrice);
    }

    if (filters.neighborhood) {
      nextParams = nextParams.set('neighborhood', filters.neighborhood);
    }

    if (filters.category) {
      nextParams = nextParams.set('category', filters.category);
    }

    if (filters.swotStatus) {
      nextParams = nextParams.set('swotStatus', filters.swotStatus);
    }

    if (filters.minScore !== null) {
      nextParams = nextParams.set('minScore', filters.minScore);
    }

    return nextParams;
  }
}
