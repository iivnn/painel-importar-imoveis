import { PropertySwotStatus } from './create-property.model';

export interface PropertyFilters {
  minPrice: number | null;
  maxPrice: number | null;
  neighborhood: string | null;
  category: string | null;
  swotStatus: PropertySwotStatus | null;
  minScore: number | null;
}

export interface PropertyFilterOptions {
  neighborhoods: string[];
  categories: string[];
}

export const EMPTY_PROPERTY_FILTERS: PropertyFilters = {
  minPrice: null,
  maxPrice: null,
  neighborhood: null,
  category: null,
  swotStatus: null,
  minScore: null
};
