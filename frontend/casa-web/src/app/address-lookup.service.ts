import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CepLookupResult } from './create-property.model';

@Injectable({ providedIn: 'root' })
export class AddressLookupService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:5074/api/address';

  lookupByCep(cep: string): Observable<CepLookupResult> {
    return this.http.get<CepLookupResult>(`${this.apiBaseUrl}/cep/${cep}`);
  }
}
