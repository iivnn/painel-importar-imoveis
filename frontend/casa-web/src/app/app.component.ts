import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

import { PropertyListingsService } from './core/services/property-listings.service';
import { ConfirmDeleteModalComponent } from './features/properties/components/confirm-delete-modal/confirm-delete-modal.component';
import { CreatePropertyModalComponent } from './features/properties/components/create-property-modal/create-property-modal.component';
import { PropertyFiltersPanelComponent } from './features/properties/components/property-filters-panel/property-filters-panel.component';
import { PropertyListingsTableComponent } from './features/properties/components/property-listings-table/property-listings-table.component';
import { PropertyMapPanelComponent } from './features/properties/components/property-map-panel/property-map-panel.component';
import { PropertySwotModalComponent } from './features/properties/components/property-swot-modal/property-swot-modal.component';
import { CreatePropertyRequest, PropertySwotStatus } from './features/properties/models/create-property.model';
import {
  EMPTY_PROPERTY_FILTERS,
  PropertyFilterOptions,
  PropertyFilters
} from './features/properties/models/property-filters.model';
import { PropertyListing, PropertyListingPage } from './features/properties/models/property-listing.model';
import { PropertySwotAnalysis, SavePropertySwotRequest } from './features/properties/models/property-swot.model';
import { ThemeToggleButtonComponent } from './shared/components/theme-toggle-button/theme-toggle-button.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    PropertyListingsTableComponent,
    ConfirmDeleteModalComponent,
    ThemeToggleButtonComponent,
    CreatePropertyModalComponent,
    PropertySwotModalComponent,
    PropertyFiltersPanelComponent,
    PropertyMapPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private readonly propertyListingsService = inject(PropertyListingsService);

  readonly pageData = signal<PropertyListingPage>({
    items: [],
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  });

  readonly mapItems = signal<PropertyListing[]>([]);
  readonly filterOptions = signal<PropertyFilterOptions>({
    neighborhoods: [],
    categories: []
  });
  readonly filters = signal<PropertyFilters>(EMPTY_PROPERTY_FILTERS);
  readonly activeView = signal<'list' | 'map'>('list');

  readonly isLoading = signal(false);
  readonly isMapLoading = signal(false);
  readonly isFilterOptionsLoading = signal(false);
  readonly loadError = signal('');
  readonly mapLoadError = signal('');

  readonly isDeleteModalOpen = signal(false);
  readonly propertyPendingDelete = signal<PropertyListing | null>(null);
  readonly isDeleting = signal(false);
  readonly deleteError = signal('');

  readonly isCreateModalOpen = signal(false);
  readonly isSaving = signal(false);
  readonly createError = signal('');

  readonly isSwotModalOpen = signal(false);
  readonly propertyPendingSwot = signal<PropertyListing | null>(null);
  readonly swotAnalysis = signal<PropertySwotAnalysis | null>(null);
  readonly isSwotLoading = signal(false);
  readonly isSwotSaving = signal(false);
  readonly swotLoadError = signal('');
  readonly swotSubmitError = signal('');

  readonly updatingStatusIds = signal<number[]>([]);

  ngOnInit(): void {
    this.loadFilterOptions();
    this.refreshData(1);
  }

  loadPage(page: number): void {
    const currentPageSize = this.pageData().pageSize;
    const nextPage = Math.max(1, page);

    this.isLoading.set(true);
    this.loadError.set('');

    this.propertyListingsService
      .getPage(nextPage, currentPageSize, this.filters())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: response => {
          this.pageData.set(response);

          if (response.totalPages > 0 && response.page > response.totalPages) {
            this.loadPage(response.totalPages);
          }
        },
        error: () => {
          this.loadError.set(
            'Nao foi possivel carregar os imoveis. Verifique se a API local esta em execucao.'
          );
        }
      });
  }

  loadMap(): void {
    this.isMapLoading.set(true);
    this.mapLoadError.set('');

    this.propertyListingsService
      .getMapItems(this.filters())
      .pipe(finalize(() => this.isMapLoading.set(false)))
      .subscribe({
        next: response => this.mapItems.set(response),
        error: () => {
          this.mapLoadError.set(
            'Nao foi possivel carregar o mapa agora. Tente novamente em alguns instantes.'
          );
        }
      });
  }

  goToPreviousPage(): void {
    if (this.isLoading() || this.pageData().page <= 1) {
      return;
    }

    this.loadPage(this.pageData().page - 1);
  }

  goToNextPage(): void {
    if (this.isLoading() || this.pageData().page >= this.pageData().totalPages) {
      return;
    }

    this.loadPage(this.pageData().page + 1);
  }

  setActiveView(view: 'list' | 'map'): void {
    this.activeView.set(view);

    if (view === 'map' && !this.mapItems().length && !this.isMapLoading()) {
      this.loadMap();
    }
  }

  applyFilters(filters: PropertyFilters): void {
    this.filters.set(filters);
    this.refreshData(1);
  }

  clearFilters(): void {
    this.filters.set(EMPTY_PROPERTY_FILTERS);
    this.refreshData(1);
  }

  openCreateModal(): void {
    this.createError.set('');
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    if (this.isSaving()) {
      return;
    }

    this.isCreateModalOpen.set(false);
    this.createError.set('');
  }

  createProperty(request: CreatePropertyRequest): void {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.createError.set('');

    this.propertyListingsService
      .create(request)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.isCreateModalOpen.set(false);
          this.loadFilterOptions();
          this.refreshData(1);
        },
        error: () => {
          this.createError.set(
            'Nao foi possivel salvar o registro agora. Confira os campos e tente novamente.'
          );
        }
      });
  }

  openDeleteModal(property: PropertyListing): void {
    this.propertyPendingDelete.set(property);
    this.deleteError.set('');
    this.isDeleteModalOpen.set(true);
  }

  openSwotModal(property: PropertyListing): void {
    this.propertyPendingSwot.set(property);
    this.swotAnalysis.set(null);
    this.swotLoadError.set('');
    this.swotSubmitError.set('');
    this.isSwotModalOpen.set(true);
    this.isSwotLoading.set(true);

    this.propertyListingsService
      .getSwot(property.id)
      .pipe(finalize(() => this.isSwotLoading.set(false)))
      .subscribe({
        next: response => {
          this.swotAnalysis.set(response);
          this.updatePropertySwotInPage(property.id, response);
        },
        error: () => {
          this.swotLoadError.set(
            'Nao foi possivel carregar a analise SWOT agora. Tente novamente.'
          );
        }
      });
  }

  closeSwotModal(): void {
    if (this.isSwotSaving()) {
      return;
    }

    this.isSwotModalOpen.set(false);
    this.propertyPendingSwot.set(null);
    this.swotLoadError.set('');
    this.swotSubmitError.set('');
  }

  saveSwot(request: SavePropertySwotRequest): void {
    const property = this.propertyPendingSwot();
    if (!property || this.isSwotSaving()) {
      return;
    }

    this.isSwotSaving.set(true);
    this.swotSubmitError.set('');

    this.propertyListingsService
      .saveSwot(property.id, request)
      .pipe(finalize(() => this.isSwotSaving.set(false)))
      .subscribe({
        next: response => {
          this.swotAnalysis.set(response);
          this.updatePropertySwotInPage(property.id, response);
          this.swotLoadError.set('');
          this.swotSubmitError.set('');
          this.refreshData(this.pageData().page);
          this.isSwotModalOpen.set(false);
          this.propertyPendingSwot.set(null);
        },
        error: () => {
          this.swotSubmitError.set(
            'Nao foi possivel salvar a analise SWOT agora. Tente novamente.'
          );
        }
      });
  }

  updatePropertyStatus(property: PropertyListing, status: PropertySwotStatus): void {
    if (this.updatingStatusIds().includes(property.id)) {
      return;
    }

    this.updatingStatusIds.update(current => [...current, property.id]);

    this.propertyListingsService
      .updateStatus(property.id, status)
      .pipe(finalize(() => {
        this.updatingStatusIds.update(current => current.filter(id => id !== property.id));
      }))
      .subscribe({
        next: updatedProperty => {
          this.pageData.update(current => ({
            ...current,
            items: current.items.map(item => item.id === updatedProperty.id ? updatedProperty : item)
          }));

          this.propertyPendingSwot.update(current => current && current.id === updatedProperty.id
            ? updatedProperty
            : current);

          this.refreshData(this.pageData().page);
        },
        error: () => {
          this.loadError.set('Nao foi possivel atualizar o status agora. Tente novamente.');
        }
      });
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.isDeleteModalOpen.set(false);
    this.propertyPendingDelete.set(null);
    this.deleteError.set('');
  }

  confirmDelete(): void {
    const property = this.propertyPendingDelete();
    if (!property || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    this.deleteError.set('');

    this.propertyListingsService
      .softDelete(property.id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          this.isDeleteModalOpen.set(false);
          this.propertyPendingDelete.set(null);
          this.loadFilterOptions();

          const currentPage = this.pageData().page;
          const remainingItems = this.pageData().items.length - 1;
          const targetPage = remainingItems <= 0 && currentPage > 1 ? currentPage - 1 : currentPage;

          this.refreshData(targetPage);
        },
        error: () => {
          this.deleteError.set(
            'Nao foi possivel excluir o registro agora. Tente novamente.'
          );
        }
      });
  }

  private refreshData(page: number): void {
    this.loadPage(page);
    this.loadMap();
  }

  private loadFilterOptions(): void {
    this.isFilterOptionsLoading.set(true);

    this.propertyListingsService
      .getFilterOptions()
      .pipe(finalize(() => this.isFilterOptionsLoading.set(false)))
      .subscribe({
        next: response => this.filterOptions.set(response),
        error: () => {
          this.filterOptions.set({
            neighborhoods: [],
            categories: []
          });
        }
      });
  }

  private updatePropertySwotInPage(propertyId: number, analysis: PropertySwotAnalysis): void {
    this.pageData.update(current => ({
      ...current,
      items: current.items.map(item => item.id === propertyId
        ? {
            ...item,
            swotStatus: analysis.swotStatus,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            opportunities: analysis.opportunities,
            threats: analysis.threats,
            score: analysis.score
          }
        : item)
    }));

    this.mapItems.update(current => current.map(item => item.id === propertyId
      ? {
          ...item,
          swotStatus: analysis.swotStatus,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          opportunities: analysis.opportunities,
          threats: analysis.threats,
          score: analysis.score
        }
      : item));

    this.propertyPendingSwot.update(current => current && current.id === propertyId
      ? {
          ...current,
          swotStatus: analysis.swotStatus,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          opportunities: analysis.opportunities,
          threats: analysis.threats,
          score: analysis.score
        }
      : current);
  }
}
