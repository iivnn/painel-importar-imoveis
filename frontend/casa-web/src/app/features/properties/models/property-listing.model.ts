import { PropertySource, PropertySwotStatus } from './create-property.model';

export interface PropertyListing {
  id: number;
  title: string;
  category: string;
  source: PropertySource;
  originalUrl: string;
  swotStatus: PropertySwotStatus;
  price: number | null;
  condoFee: number | null;
  iptu: number | null;
  insurance: number | null;
  serviceFee: number | null;
  upfrontCost: number | null;
  addressLine: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  hasExactLocation: boolean;
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
  score: number | null;
  notes: string;
  discardReason: string;
  isFavorite: boolean;
  excluded: boolean;
  createdAtUtc: string;
}

export interface PropertyListingPage {
  items: PropertyListing[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
