import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CreatePropertyRequest, PropertySwotStatus } from '../../features/properties/models/create-property.model';
import {
  PropertyFavoriteSortBy,
  PropertyFavoritesFilters,
  PropertyFavoritesResponse
} from '../../features/properties/models/property-favorites.model';
import {
  PropertyAttachmentKind,
  PropertyDetails
} from '../../features/properties/models/property-details.model';
import { PropertyFilterOptions, PropertyFilters } from '../../features/properties/models/property-filters.model';
import { PropertyListing, PropertyListingPage } from '../../features/properties/models/property-listing.model';
import { PropertySwotAnalysis, SavePropertySwotRequest } from '../../features/properties/models/property-swot.model';

@Injectable({ providedIn: 'root' })
export class PropertyListingsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:5074/api/properties';
  private readonly fileBaseUrl = 'http://localhost:5074';

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

  getFavorites(
    filters: PropertyFavoritesFilters,
    sortBy: PropertyFavoriteSortBy,
    page: number,
    pageSize: number
  ): Observable<PropertyFavoritesResponse> {
    let params = new HttpParams()
      .set('sortBy', sortBy)
      .set('page', page)
      .set('pageSize', pageSize);

    if (filters.minPrice !== null) {
      params = params.set('minPrice', filters.minPrice);
    }

    if (filters.maxPrice !== null) {
      params = params.set('maxPrice', filters.maxPrice);
    }

    if (filters.neighborhood) {
      params = params.set('neighborhood', filters.neighborhood);
    }

    if (filters.category) {
      params = params.set('category', filters.category);
    }

    if (filters.swotStatus) {
      params = params.set('swotStatus', filters.swotStatus);
    }

    if (filters.minScore !== null) {
      params = params.set('minScore', filters.minScore);
    }

    if (filters.onlyWithSwot) {
      params = params.set('onlyWithSwot', true);
    }

    if (filters.onlyWithNotes) {
      params = params.set('onlyWithNotes', true);
    }

    if (filters.onlyWithMedia) {
      params = params.set('onlyWithMedia', true);
    }

    return new Observable<PropertyFavoritesResponse>(subscriber => {
      this.http.get<PropertyFavoritesResponse>(`${this.apiBaseUrl}/favorites`, { params }).subscribe({
        next: response => {
          subscriber.next({
            ...response,
            items: response.items.map(item => ({
              ...item,
              thumbnailUrls: item.thumbnailUrls.map(url => url.startsWith('http')
                ? url
                : `${this.fileBaseUrl}${url}`)
            }))
          });
          subscriber.complete();
        },
        error: error => subscriber.error(error)
      });
    });
  }

  softDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/${id}`);
  }

  create(request: CreatePropertyRequest): Observable<void> {
    return this.http.post<void>(this.apiBaseUrl, request);
  }

  update(id: number, request: CreatePropertyRequest): Observable<PropertyListing> {
    return this.http.put<PropertyListing>(`${this.apiBaseUrl}/${id}`, request);
  }

  getSwot(id: number): Observable<PropertySwotAnalysis> {
    return this.http.get<PropertySwotAnalysis>(`${this.apiBaseUrl}/${id}/swot`);
  }

  saveSwot(id: number, request: SavePropertySwotRequest): Observable<PropertySwotAnalysis> {
    return this.http.put<PropertySwotAnalysis>(`${this.apiBaseUrl}/${id}/swot`, request);
  }

  updateStatus(id: number, swotStatus: PropertySwotStatus, reason = ''): Observable<PropertyListing> {
    return this.http.put<PropertyListing>(`${this.apiBaseUrl}/${id}/status`, { swotStatus, reason });
  }

  updateFavorite(id: number, isFavorite: boolean): Observable<PropertyListing> {
    return this.http.put<PropertyListing>(`${this.apiBaseUrl}/${id}/favorite`, { isFavorite });
  }

  getDetails(id: number): Observable<PropertyDetails> {
    return new Observable<PropertyDetails>(subscriber => {
      this.http.get<PropertyDetails>(`${this.apiBaseUrl}/${id}/details`).subscribe({
        next: response => {
          subscriber.next(this.mapPropertyDetails(response));
          subscriber.complete();
        },
        error: error => subscriber.error(error)
      });
    });
  }

  updateNotes(id: number, notes: string): Observable<PropertyDetails> {
    return new Observable<PropertyDetails>(subscriber => {
      this.http.put<PropertyDetails>(`${this.apiBaseUrl}/${id}/notes`, { notes }).subscribe({
        next: response => {
          subscriber.next(this.mapPropertyDetails(response));
          subscriber.complete();
        },
        error: error => subscriber.error(error)
      });
    });
  }

  uploadAttachments(
    id: number,
    kind: PropertyAttachmentKind,
    files: File[]
  ): Observable<PropertyDetails> {
    const formData = new FormData();
    formData.append('kind', kind);

    files.forEach(file => formData.append('files', file, file.name));

    return new Observable<PropertyDetails>(subscriber => {
      this.http.post<PropertyDetails>(`${this.apiBaseUrl}/${id}/attachments`, formData).subscribe({
        next: response => {
          subscriber.next(this.mapPropertyDetails(response));
          subscriber.complete();
        },
        error: error => subscriber.error(error)
      });
    });
  }

  deleteAttachment(propertyId: number, attachmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/${propertyId}/attachments/${attachmentId}`);
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

  private mapPropertyDetails(details: PropertyDetails): PropertyDetails {
    return {
      ...details,
      attachments: details.attachments.map(attachment => ({
        ...attachment,
        fileUrl: attachment.fileUrl.startsWith('http')
          ? attachment.fileUrl
          : `${this.fileBaseUrl}${attachment.fileUrl}`
      }))
    };
  }
}
