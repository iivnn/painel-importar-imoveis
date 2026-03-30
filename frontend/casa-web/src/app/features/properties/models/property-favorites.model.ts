import { PropertySource, PropertySwotStatus } from './create-property.model';

export type PropertyFavoriteSortBy = 'Recent' | 'LowestPrice' | 'HighestScore' | 'Status';

export interface PropertyFavoritesFilters {
  minPrice: number | null;
  maxPrice: number | null;
  neighborhood: string | null;
  category: string | null;
  swotStatus: PropertySwotStatus | null;
  minScore: number | null;
  onlyWithSwot: boolean;
  onlyWithNotes: boolean;
  onlyWithMedia: boolean;
}

export const EMPTY_PROPERTY_FAVORITES_FILTERS: PropertyFavoritesFilters = {
  minPrice: null,
  maxPrice: null,
  neighborhood: null,
  category: null,
  swotStatus: null,
  minScore: null,
  onlyWithSwot: false,
  onlyWithNotes: false,
  onlyWithMedia: false
};

export interface PropertyFavoriteStatusSummary {
  status: PropertySwotStatus;
  count: number;
}

export interface PropertyFavoriteSummary {
  totalFavorites: number;
  averagePrice: number | null;
  highestScore: number | null;
  statusBreakdown: PropertyFavoriteStatusSummary[];
}

export interface PropertyFavoriteItem {
  id: number;
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
  latitude: number | null;
  longitude: number | null;
  hasExactLocation: boolean;
  score: number | null;
  strengthsPreview: string;
  threatsPreview: string;
  hasNotes: boolean;
  hasMedia: boolean;
  mediaCount: number;
  thumbnailUrls: string[];
  createdAtUtc: string;
}

export interface PropertyFavoritesResponse {
  summary: PropertyFavoriteSummary;
  filterOptions: {
    neighborhoods: string[];
    categories: string[];
  };
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: PropertyFavoriteItem[];
}
