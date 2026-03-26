export type PropertySource =
  | 'AppExterno'
  | 'PortalWeb'
  | 'Indicacao'
  | 'Corretor'
  | 'Outro';

export type PropertySwotStatus =
  | 'Novo'
  | 'EmAnalise'
  | 'Visitado'
  | 'Proposta'
  | 'Descartado'
  | 'Favorito';

export interface CreatePropertyRequest {
  title: string;
  category: string;
  source: PropertySource;
  originalUrl: string;
  swotStatus: PropertySwotStatus;
  price: number | null;
  addressLine: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  hasExactLocation: boolean;
  excluded: boolean;
}

export interface CepLookupResult {
  postalCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}
