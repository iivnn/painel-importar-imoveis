export interface PropertyListing {
  id: number;
  title: string;
  category: string;
  source: string;
  originalUrl: string;
  swotStatus: string;
  price: number | null;
  addressLine: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  hasExactLocation: boolean;
  createdAtUtc: string;
}

export interface PropertyListingPage {
  items: PropertyListing[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
