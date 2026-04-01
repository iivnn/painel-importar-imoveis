import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { getApiUrl } from '../config/app-runtime-config';
import { CepLookupResult } from '../../features/properties/models/create-property.model';

@Injectable({ providedIn: 'root' })
export class AddressLookupService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = getApiUrl('/api/address');

  lookupByCep(cep: string): Observable<CepLookupResult> {
    return this.http.get<CepLookupResult>(`${this.apiBaseUrl}/cep/${cep}`);
  }
}
