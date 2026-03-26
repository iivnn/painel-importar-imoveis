import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PropertySwotStatus } from '../create-property.model';
import {
  EMPTY_PROPERTY_FILTERS,
  PropertyFilterOptions,
  PropertyFilters
} from '../property-filters.model';

type FilterDraft = {
  minPrice: string;
  maxPrice: string;
  neighborhood: string;
  category: string;
  swotStatus: PropertySwotStatus | '';
  minScore: string;
};

@Component({
  selector: 'app-property-filters-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './property-filters-panel.component.html',
  styleUrl: './property-filters-panel.component.css'
})
export class PropertyFiltersPanelComponent {
  readonly filters = input<PropertyFilters>(EMPTY_PROPERTY_FILTERS);
  readonly filterOptions = input<PropertyFilterOptions>({
    neighborhoods: [],
    categories: []
  });
  readonly totalItems = input(0);
  readonly activeView = input<'list' | 'map'>('list');
  readonly isLoading = input(false);

  readonly applyFilters = output<PropertyFilters>();
  readonly clearFilters = output<void>();
  readonly changeView = output<'list' | 'map'>();

  readonly statusOptions: { value: PropertySwotStatus; label: string }[] = [
    { value: 'Novo', label: 'Novo' },
    { value: 'EmAnalise', label: 'Em analise' },
    { value: 'Visitado', label: 'Visitado' },
    { value: 'Proposta', label: 'Proposta' },
    { value: 'Favorito', label: 'Favorito' },
    { value: 'Descartado', label: 'Descartado' }
  ];

  readonly draft = signal<FilterDraft>({
    minPrice: '',
    maxPrice: '',
    neighborhood: '',
    category: '',
    swotStatus: '',
    minScore: ''
  });

  constructor() {
    effect(() => {
      const filters = this.filters();

      this.draft.set({
        minPrice: filters.minPrice?.toString() ?? '',
        maxPrice: filters.maxPrice?.toString() ?? '',
        neighborhood: filters.neighborhood ?? '',
        category: filters.category ?? '',
        swotStatus: filters.swotStatus ?? '',
        minScore: filters.minScore?.toString() ?? ''
      });
    }, { allowSignalWrites: true });
  }

  updateField(field: keyof FilterDraft, value: string): void {
    this.draft.update(current => ({
      ...current,
      [field]: value
    }));
  }

  submit(): void {
    const value = this.draft();

    this.applyFilters.emit({
      minPrice: this.parseNumber(value.minPrice),
      maxPrice: this.parseNumber(value.maxPrice),
      neighborhood: value.neighborhood.trim() || null,
      category: value.category.trim() || null,
      swotStatus: value.swotStatus || null,
      minScore: this.parseNumber(value.minScore)
    });
  }

  reset(): void {
    this.draft.set({
      minPrice: '',
      maxPrice: '',
      neighborhood: '',
      category: '',
      swotStatus: '',
      minScore: ''
    });

    this.clearFilters.emit();
  }

  private parseNumber(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number.parseFloat(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }
}
