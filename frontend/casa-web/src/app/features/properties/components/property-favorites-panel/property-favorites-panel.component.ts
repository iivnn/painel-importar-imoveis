import { DecimalPipe } from '@angular/common';
import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  EMPTY_PROPERTY_FAVORITES_FILTERS,
  PropertyFavoriteItem,
  PropertyFavoriteSortBy,
  PropertyFavoritesFilters,
  PropertyFavoritesResponse
} from '../../models/property-favorites.model';
import { PropertySwotStatus } from '../../models/create-property.model';
import { AppSettings } from '../../../settings/models/app-settings.model';
import { FavoriteMediaCarouselComponent } from '../favorite-media-carousel/favorite-media-carousel.component';
import { MapTooltipButtonComponent } from '../map-tooltip-button/map-tooltip-button.component';

type FavoritesDraft = {
  minPrice: string;
  maxPrice: string;
  neighborhood: string;
  category: string;
  swotStatus: PropertySwotStatus | '';
  minScore: string;
  onlyWithSwot: boolean;
  onlyWithNotes: boolean;
  onlyWithMedia: boolean;
};

@Component({
  selector: 'app-property-favorites-panel',
  standalone: true,
  imports: [FormsModule, DecimalPipe, FavoriteMediaCarouselComponent, MapTooltipButtonComponent],
  templateUrl: './property-favorites-panel.component.html',
  styleUrl: './property-favorites-panel.component.css'
})
export class PropertyFavoritesPanelComponent {
  readonly data = input<PropertyFavoritesResponse | null>(null);
  readonly filters = input<PropertyFavoritesFilters>(EMPTY_PROPERTY_FAVORITES_FILTERS);
  readonly sortBy = input<PropertyFavoriteSortBy>('Recent');
  readonly settings = input<AppSettings | null>(null);
  readonly isLoading = input(false);
  readonly loadError = input('');

  readonly applyFilters = output<PropertyFavoritesFilters>();
  readonly clearFilters = output<void>();
  readonly changeSort = output<PropertyFavoriteSortBy>();
  readonly previousPage = output<void>();
  readonly nextPage = output<void>();
  readonly toggleFavorite = output<number>();
  readonly requestMedia = output<number>();
  readonly requestSwot = output<number>();
  readonly requestDetail = output<number>();
  readonly toggleCompare = output<number>();

  readonly statusOptions: { value: PropertySwotStatus; label: string }[] = [
    { value: 'Novo', label: 'Novo' },
    { value: 'EmAnalise', label: 'Em analise' },
    { value: 'Visitado', label: 'Visitado' },
    { value: 'Proposta', label: 'Proposta' },
    { value: 'Descartado', label: 'Descartado' }
  ];

  readonly sortOptions: { value: PropertyFavoriteSortBy; label: string }[] = [
    { value: 'Recent', label: 'Mais recentes' },
    { value: 'HighestScore', label: 'Maior nota' },
    { value: 'LowestPrice', label: 'Menor preco' },
    { value: 'Status', label: 'Status' }
  ];

  readonly draft = signal<FavoritesDraft>({
    minPrice: '',
    maxPrice: '',
    neighborhood: '',
    category: '',
    swotStatus: '',
    minScore: '',
    onlyWithSwot: false,
    onlyWithNotes: false,
    onlyWithMedia: false
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
        minScore: filters.minScore?.toString() ?? '',
        onlyWithSwot: filters.onlyWithSwot,
        onlyWithNotes: filters.onlyWithNotes,
        onlyWithMedia: filters.onlyWithMedia
      });
    }, { allowSignalWrites: true });
  }

  updateField(field: keyof FavoritesDraft, value: string | boolean): void {
    this.draft.update(current => ({
      ...current,
      [field]: value
    }) as FavoritesDraft);
  }

  submit(): void {
    const value = this.draft();

    this.applyFilters.emit({
      minPrice: this.parseNumber(value.minPrice),
      maxPrice: this.parseNumber(value.maxPrice),
      neighborhood: value.neighborhood.trim() || null,
      category: value.category.trim() || null,
      swotStatus: value.swotStatus || null,
      minScore: this.parseNumber(value.minScore),
      onlyWithSwot: value.onlyWithSwot,
      onlyWithNotes: value.onlyWithNotes,
      onlyWithMedia: value.onlyWithMedia
    });
  }

  reset(): void {
    this.clearFilters.emit();
  }

  emitSortChange(value: string): void {
    this.changeSort.emit(value as PropertyFavoriteSortBy);
  }

  statusCount(status: PropertySwotStatus): number {
    return this.data()?.summary.statusBreakdown.find(item => item.status === status)?.count ?? 0;
  }

  hasEmptyState(): boolean {
    return !this.isLoading() && !this.loadError() && (this.data()?.items.length ?? 0) === 0;
  }

  trackByPropertyId(_: number, item: PropertyFavoriteItem): number {
    return item.id;
  }

  displayedRangeStart(): number {
    const response = this.data();
    if (!response || response.totalItems === 0) {
      return 0;
    }

    return ((response.page - 1) * response.pageSize) + 1;
  }

  displayedRangeEnd(): number {
    const response = this.data();
    if (!response) {
      return 0;
    }

    return Math.min(response.page * response.pageSize, response.totalItems);
  }

  profileFitScore(item: PropertyFavoriteItem): number {
    const settings = this.settings();
    if (!settings) {
      return 0;
    }

    const totalWeight =
      settings.priceWeight
      + settings.locationWeight
      + settings.analysisWeight
      + settings.evidenceWeight
      + settings.sourceQualityWeight;

    if (totalWeight <= 0) {
      return 0;
    }

    const weightedScore =
      (this.priceFit(item, settings) * settings.priceWeight)
      + (this.locationFit(item, settings) * settings.locationWeight)
      + (this.analysisFit(item) * settings.analysisWeight)
      + (this.evidenceFit(item) * settings.evidenceWeight)
      + (this.sourceQualityFit(item) * settings.sourceQualityWeight);

    return Math.round(weightedScore / totalWeight);
  }

  private parseNumber(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number.parseFloat(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private priceFit(item: PropertyFavoriteItem, settings: AppSettings): number {
    if (item.price === null) {
      return 35;
    }

    if (item.price <= settings.monthlyBudgetIdeal) {
      return 100;
    }

    if (item.price <= settings.monthlyBudgetMax) {
      const interval = Math.max(settings.monthlyBudgetMax - settings.monthlyBudgetIdeal, 1);
      const distance = item.price - settings.monthlyBudgetIdeal;
      return Math.max(55, 100 - ((distance / interval) * 45));
    }

    const overflow = item.price - settings.monthlyBudgetMax;
    return Math.max(10, 50 - (overflow / Math.max(settings.monthlyBudgetMax, 1)) * 100);
  }

  private locationFit(item: PropertyFavoriteItem, settings: AppSettings): number {
    let score = item.hasExactLocation ? 80 : 60;

    if (settings.preferredNeighborhoods.some(neighborhood => neighborhood === item.neighborhood)) {
      score += 20;
    }

    if (settings.avoidedNeighborhoods.some(neighborhood => neighborhood === item.neighborhood)) {
      score -= 45;
    }

    return Math.max(0, Math.min(100, score));
  }

  private analysisFit(item: PropertyFavoriteItem): number {
    if (item.score !== null) {
      return Math.max(0, Math.min(100, item.score * 10));
    }

    return item.swotStatus === 'Novo' ? 30 : 65;
  }

  private evidenceFit(item: PropertyFavoriteItem): number {
    let score = 20;
    if (item.hasNotes) {
      score += 35;
    }

    if (item.hasMedia) {
      score += Math.min(45, item.mediaCount * 15);
    }

    return Math.max(0, Math.min(100, score));
  }

  private sourceQualityFit(item: PropertyFavoriteItem): number {
    let score = item.originalUrl ? 70 : 35;

    if (item.source === 'PortalWeb') {
      score += 10;
    }

    if (item.source === 'Corretor' || item.source === 'Indicacao') {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }
}
