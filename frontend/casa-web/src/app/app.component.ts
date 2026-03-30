import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { finalize, firstValueFrom } from 'rxjs';
import * as signalR from '@microsoft/signalr';

import { AppSettingsService } from './core/services/app-settings.service';
import { PropertyInconsistenciesService } from './core/services/property-inconsistencies.service';
import { PropertyListingsService } from './core/services/property-listings.service';
import { AppSettingsPanelComponent } from './features/settings/components/app-settings-panel/app-settings-panel.component';
import { AppSettings, DEFAULT_APP_SETTINGS } from './features/settings/models/app-settings.model';
import { ConfirmDeleteModalComponent } from './features/properties/components/confirm-delete-modal/confirm-delete-modal.component';
import { CreatePropertyModalComponent } from './features/properties/components/create-property-modal/create-property-modal.component';
import { PropertyComparePanelComponent } from './features/properties/components/property-compare-panel/property-compare-panel.component';
import { PropertyDetailPanelComponent } from './features/properties/components/property-detail-panel/property-detail-panel.component';
import { PropertyFavoritesPanelComponent } from './features/properties/components/property-favorites-panel/property-favorites-panel.component';
import { PropertyInconsistenciesPanelComponent } from './features/properties/components/property-inconsistencies-panel/property-inconsistencies-panel.component';
import { PropertyMediaModalComponent } from './features/properties/components/property-media-modal/property-media-modal.component';
import { PropertyFiltersPanelComponent } from './features/properties/components/property-filters-panel/property-filters-panel.component';
import { PropertyListingsTableComponent } from './features/properties/components/property-listings-table/property-listings-table.component';
import { PropertyMapPanelComponent } from './features/properties/components/property-map-panel/property-map-panel.component';
import { PropertySwotModalComponent } from './features/properties/components/property-swot-modal/property-swot-modal.component';
import { CreatePropertyRequest, PropertySwotStatus } from './features/properties/models/create-property.model';
import {
  EMPTY_PROPERTY_FAVORITES_FILTERS,
  PropertyFavoriteSortBy,
  PropertyFavoritesFilters,
  PropertyFavoritesResponse
} from './features/properties/models/property-favorites.model';
import { PropertyAttachmentKind, PropertyDetails } from './features/properties/models/property-details.model';
import {
  EMPTY_PROPERTY_FILTERS,
  PropertyFilterOptions,
  PropertyFilters
} from './features/properties/models/property-filters.model';
import { PropertyListing, PropertyListingPage } from './features/properties/models/property-listing.model';
import {
  PropertyInconsistenciesResponse,
  PropertyInconsistencyItem,
  PropertyInconsistencySummary
} from './features/properties/models/property-inconsistency.model';
import { PropertySwotAnalysis, SavePropertySwotRequest } from './features/properties/models/property-swot.model';
import { GlobalMapPreviewComponent } from './shared/components/global-map-preview/global-map-preview.component';
import { ThemeToggleButtonComponent } from './shared/components/theme-toggle-button/theme-toggle-button.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    AppSettingsPanelComponent,
    PropertyListingsTableComponent,
    ConfirmDeleteModalComponent,
    GlobalMapPreviewComponent,
    ThemeToggleButtonComponent,
    CreatePropertyModalComponent,
    PropertyComparePanelComponent,
    PropertyDetailPanelComponent,
    PropertyFavoritesPanelComponent,
    PropertyInconsistenciesPanelComponent,
    PropertyMediaModalComponent,
    PropertySwotModalComponent,
    PropertyFiltersPanelComponent,
    PropertyMapPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly appSettingsService = inject(AppSettingsService);
  private readonly propertyInconsistenciesService = inject(PropertyInconsistenciesService);
  private readonly propertyListingsService = inject(PropertyListingsService);
  private inconsistencyConnection: signalR.HubConnection | null = null;
  private scrollToHighlightedRowAttempts = 0;
  private isRefreshingFromRealtime = false;

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
  readonly activeSection = signal<'inicio' | 'favoritos' | 'inconsistencias' | 'configuracoes' | 'detalhe' | 'comparar'>('inicio');
  readonly highlightedPropertyId = signal<number | null>(null);
  readonly favoriteFilters = signal<PropertyFavoritesFilters>(EMPTY_PROPERTY_FAVORITES_FILTERS);
  readonly favoriteSortBy = signal<PropertyFavoriteSortBy>('Recent');
  readonly favoritesPage = signal(1);
  readonly favoritesPageSize = signal(6);

  readonly isLoading = signal(false);
  readonly isMapLoading = signal(false);
  readonly isFilterOptionsLoading = signal(false);
  readonly isFavoritesLoading = signal(false);
  readonly isInconsistenciesLoading = signal(false);
  readonly dismissingInconsistencyIds = signal<string[]>([]);
  readonly loadError = signal('');
  readonly mapLoadError = signal('');
  readonly favoritesLoadError = signal('');
  readonly inconsistenciesLoadError = signal('');

  readonly favoritesData = signal<PropertyFavoritesResponse | null>(null);
  readonly inconsistenciesSummary = signal<PropertyInconsistencySummary | null>(null);
  readonly inconsistencyItems = signal<PropertyInconsistencyItem[]>([]);
  readonly appSettings = signal<AppSettings>(DEFAULT_APP_SETTINGS);
  readonly isSettingsLoading = signal(false);
  readonly isSettingsSaving = signal(false);
  readonly settingsLoadError = signal('');
  readonly settingsSaveError = signal('');
  readonly settingsSaveSuccessMessage = signal('');

  readonly isDeleteModalOpen = signal(false);
  readonly propertyPendingDelete = signal<PropertyListing | null>(null);
  readonly isDeleting = signal(false);
  readonly deleteError = signal('');

  readonly isCreateModalOpen = signal(false);
  readonly createModalMode = signal<'create' | 'edit'>('create');
  readonly propertyPendingEdit = signal<PropertyListing | null>(null);
  readonly isSaving = signal(false);
  readonly createError = signal('');

  readonly selectedPropertyDetails = signal<PropertyDetails | null>(null);
  readonly isPropertyDetailsLoading = signal(false);
  readonly propertyDetailsLoadError = signal('');
  readonly comparePropertyIds = signal<number[]>([]);
  readonly compareDetails = signal<PropertyDetails[]>([]);
  readonly isCompareLoading = signal(false);
  readonly compareLoadError = signal('');

  readonly isMediaModalOpen = signal(false);
  readonly propertyPendingMedia = signal<PropertyListing | null>(null);
  readonly propertyDetails = signal<PropertyDetails | null>(null);
  readonly isDetailsLoading = signal(false);
  readonly isNotesSaving = signal(false);
  readonly activeUploadKind = signal<PropertyAttachmentKind | null>(null);
  readonly deletingAttachmentIds = signal<number[]>([]);
  readonly detailsLoadError = signal('');
  readonly detailsSubmitError = signal('');

  readonly isSwotModalOpen = signal(false);
  readonly propertyPendingSwot = signal<PropertyListing | null>(null);
  readonly swotAnalysis = signal<PropertySwotAnalysis | null>(null);
  readonly isSwotLoading = signal(false);
  readonly isSwotSaving = signal(false);
  readonly swotLoadError = signal('');
  readonly swotSubmitError = signal('');

  readonly updatingStatusIds = signal<number[]>([]);

  ngOnInit(): void {
    this.loadSettings();
    this.startInconsistencyRealtime();
  }

  ngOnDestroy(): void {
    void this.inconsistencyConnection?.stop();
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
          this.scheduleHighlightedPropertyScroll();

          if (response.totalPages > 0 && response.page > response.totalPages) {
            this.loadPage(response.totalPages);
          }
        },
        error: () => {
          this.loadError.set(
            'N\u00e3o foi poss\u00edvel carregar os im\u00f3veis. Verifique se a API local est\u00e1 em execu\u00e7\u00e3o.'
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
            'N\u00e3o foi poss\u00edvel carregar o mapa agora. Tente novamente em alguns instantes.'
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

  showHome(): void {
    this.activeSection.set('inicio');
  }

  showInconsistencies(): void {
    this.activeSection.set('inconsistencias');
    this.loadInconsistencies();
  }

  dismissInconsistency(inconsistencyId: string): void {
    if (this.dismissingInconsistencyIds().includes(inconsistencyId)) {
      return;
    }

    this.dismissingInconsistencyIds.update(current => [...current, inconsistencyId]);

    this.propertyInconsistenciesService
      .dismiss(inconsistencyId)
      .pipe(finalize(() => {
        this.dismissingInconsistencyIds.update(current => current.filter(id => id !== inconsistencyId));
      }))
      .subscribe({
        next: () => {
          this.loadInconsistencies();
          this.loadInconsistenciesSummary();
        },
        error: () => {
          this.inconsistenciesLoadError.set('Não foi possível ignorar a inconsistência agora. Tente novamente.');
        }
      });
  }

  showFavorites(): void {
    this.activeSection.set('favoritos');
    this.loadFavorites();
  }

  showCompare(): void {
    this.activeSection.set('comparar');
    this.loadCompareDetails();
  }

  showSettings(): void {
    this.activeSection.set('configuracoes');
  }

  openPropertyFromInconsistency(propertyId: number): void {
    this.activeSection.set('inicio');
    this.activeView.set('list');
    this.filters.set(EMPTY_PROPERTY_FILTERS);
    this.highlightedPropertyId.set(propertyId);
    this.scrollToHighlightedRowAttempts = 0;

    this.propertyListingsService.getMapItems(EMPTY_PROPERTY_FILTERS).subscribe({
      next: properties => {
        const pageSize = this.pageData().pageSize || 10;
        const propertyIndex = properties.findIndex(property => property.id === propertyId);

        if (propertyIndex >= 0) {
          const targetPage = Math.floor(propertyIndex / pageSize) + 1;
          this.loadPage(targetPage);
        } else {
          this.loadPage(1);
        }

        window.setTimeout(() => this.highlightedPropertyId.set(null), 4500);
      },
      error: () => {
        this.loadPage(1);
        window.setTimeout(() => this.highlightedPropertyId.set(null), 4500);
      }
    });
  }

  applyFilters(filters: PropertyFilters): void {
    this.filters.set(filters);
    this.refreshData(1);
  }

  clearFilters(): void {
    this.filters.set(EMPTY_PROPERTY_FILTERS);
    this.refreshData(1);
  }

  applyFavoriteFilters(filters: PropertyFavoritesFilters): void {
    this.favoriteFilters.set(filters);
    this.favoritesPage.set(1);
    this.loadFavorites();
  }

  clearFavoriteFilters(): void {
    this.favoriteFilters.set(EMPTY_PROPERTY_FAVORITES_FILTERS);
    this.favoritesPage.set(1);
    this.loadFavorites();
  }

  changeFavoriteSort(sortBy: PropertyFavoriteSortBy): void {
    this.favoriteSortBy.set(sortBy);
    this.favoritesPage.set(1);
    this.loadFavorites();
  }

  goToPreviousFavoritesPage(): void {
    if (this.isFavoritesLoading() || this.favoritesPage() <= 1) {
      return;
    }

    this.favoritesPage.update(current => current - 1);
    this.loadFavorites();
  }

  goToNextFavoritesPage(): void {
    const totalPages = this.favoritesData()?.totalPages ?? 0;
    if (this.isFavoritesLoading() || this.favoritesPage() >= totalPages) {
      return;
    }

    this.favoritesPage.update(current => current + 1);
    this.loadFavorites();
  }

  openCreateModal(): void {
    this.createError.set('');
    this.createModalMode.set('create');
    this.propertyPendingEdit.set(null);
    this.isCreateModalOpen.set(true);
  }

  openEditModal(property: PropertyListing): void {
    this.createError.set('');
    this.createModalMode.set('edit');
    this.propertyPendingEdit.set(property);
    this.isCreateModalOpen.set(true);
  }

  openEditModalById(propertyId: number): void {
    const property = this.findPropertyById(propertyId);
    if (property) {
      this.openEditModal(property);
    }
  }

  closeCreateModal(): void {
    if (this.isSaving()) {
      return;
    }

    this.isCreateModalOpen.set(false);
    this.createModalMode.set('create');
    this.propertyPendingEdit.set(null);
    this.createError.set('');
  }

  createProperty(request: CreatePropertyRequest): void {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.createError.set('');

    if (this.createModalMode() === 'edit' && this.propertyPendingEdit()) {
      this.propertyListingsService
        .update(this.propertyPendingEdit()!.id, request)
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe({
          next: property => {
            this.isCreateModalOpen.set(false);
            this.createModalMode.set('create');
            this.propertyPendingEdit.set(null);
            this.loadFilterOptions();
            this.refreshData(1);
            this.loadFavorites();
            if (this.activeSection() === 'detalhe') {
              this.openPropertyDetailById(property.id);
            }
          },
          error: () => {
            this.createError.set(
              'N\u00e3o foi poss\u00edvel salvar o registro agora. Confira os campos e tente novamente.'
            );
          }
        });

      return;
    }

    this.propertyListingsService
      .create(request)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.isCreateModalOpen.set(false);
          this.createModalMode.set('create');
          this.propertyPendingEdit.set(null);
          this.loadFilterOptions();
          this.refreshData(1);
          this.loadFavorites();
        },
        error: () => {
          this.createError.set(
            'N\u00e3o foi poss\u00edvel salvar o registro agora. Confira os campos e tente novamente.'
          );
        }
      });
  }

  saveSettings(request: AppSettings): void {
    if (this.isSettingsSaving()) {
      return;
    }

    this.isSettingsSaving.set(true);
    this.settingsSaveError.set('');
    this.settingsSaveSuccessMessage.set('');

    this.appSettingsService
      .updateSettings(request)
      .pipe(finalize(() => this.isSettingsSaving.set(false)))
      .subscribe({
        next: settings => {
          this.applySettings(settings);
          this.settingsSaveSuccessMessage.set('Configurações salvas com sucesso.');
          window.setTimeout(() => {
            if (this.settingsSaveSuccessMessage() === 'Configurações salvas com sucesso.') {
              this.settingsSaveSuccessMessage.set('');
            }
          }, 3000);
          this.refreshData(1);
          this.loadFavorites();
          this.loadInconsistenciesSummary();
          if (this.activeSection() === 'inconsistencias') {
            this.loadInconsistencies();
          }
        },
        error: () => {
          this.settingsSaveError.set('Não foi possível salvar as configurações agora. Tente novamente.');
        }
      });
  }

  openMediaModal(property: PropertyListing): void {
    this.propertyPendingMedia.set(property);
    this.propertyDetails.set(null);
    this.detailsLoadError.set('');
    this.detailsSubmitError.set('');
    this.isMediaModalOpen.set(true);
    this.isDetailsLoading.set(true);

    this.propertyListingsService
      .getDetails(property.id)
      .pipe(finalize(() => this.isDetailsLoading.set(false)))
      .subscribe({
        next: details => {
          this.propertyDetails.set(details);
        },
        error: () => {
          this.detailsLoadError.set(
            'N\u00e3o foi poss\u00edvel carregar fotos, prints e observa\u00e7\u00f5es agora. Tente novamente.'
          );
        }
      });
  }

  openPropertyDetail(property: PropertyListing): void {
    this.openPropertyDetailById(property.id);
  }

  openPropertyDetailById(propertyId: number): void {
    this.activeSection.set('detalhe');
    this.isPropertyDetailsLoading.set(true);
    this.propertyDetailsLoadError.set('');
    this.selectedPropertyDetails.set(null);

    this.propertyListingsService
      .getDetails(propertyId)
      .pipe(finalize(() => this.isPropertyDetailsLoading.set(false)))
      .subscribe({
        next: details => this.selectedPropertyDetails.set(details),
        error: () => {
          this.propertyDetailsLoadError.set('Não foi possível carregar o detalhe do imóvel agora.');
        }
      });
  }

  closePropertyDetail(): void {
    this.activeSection.set('inicio');
  }

  toggleCompareSelection(property: PropertyListing): void {
    this.comparePropertyIds.update(current => {
      if (current.includes(property.id)) {
        return current.filter(id => id !== property.id);
      }

      return current.length >= 3 ? [...current.slice(1), property.id] : [...current, property.id];
    });

    if (this.activeSection() === 'comparar') {
      this.loadCompareDetails();
    }
  }

  toggleCompareSelectionById(propertyId: number): void {
    const property = this.findPropertyById(propertyId);
    if (!property) {
      return;
    }

    this.toggleCompareSelection(property);
  }

  removeFromCompare(propertyId: number): void {
    this.comparePropertyIds.update(current => current.filter(id => id !== propertyId));
    this.compareDetails.update(current => current.filter(item => item.propertyId !== propertyId));
    if (this.activeSection() === 'comparar') {
      this.loadCompareDetails();
    }
  }

  openDetailFromCompare(propertyId: number): void {
    this.openPropertyDetailById(propertyId);
  }

  closeMediaModal(): void {
    if (this.isNotesSaving() || this.activeUploadKind() !== null || this.deletingAttachmentIds().length) {
      return;
    }

    this.resetMediaModalState();
  }

  savePropertyNotes(notes: string): void {
    const property = this.propertyPendingMedia();
    if (!property || this.isNotesSaving()) {
      return;
    }

    this.isNotesSaving.set(true);
    this.detailsSubmitError.set('');

    this.propertyListingsService
      .updateNotes(property.id, notes)
      .subscribe({
        next: details => {
          this.propertyDetails.set(details);
          this.isNotesSaving.set(false);
          this.loadFavorites();
          this.resetMediaModalState();
        },
        error: () => {
          this.isNotesSaving.set(false);
          this.detailsSubmitError.set(
            'N\u00e3o foi poss\u00edvel salvar as observa\u00e7\u00f5es agora. Tente novamente.'
          );
        }
      });
  }

  uploadPropertyAttachments(kind: PropertyAttachmentKind, files: File[]): void {
    const property = this.propertyPendingMedia();
    if (!property || !files.length || this.activeUploadKind() !== null) {
      return;
    }

    this.activeUploadKind.set(kind);
    this.detailsSubmitError.set('');

    this.propertyListingsService
      .uploadAttachments(property.id, kind, files)
      .pipe(finalize(() => this.activeUploadKind.set(null)))
      .subscribe({
        next: details => {
          this.propertyDetails.set(details);
          this.loadFavorites();
        },
        error: () => {
          this.detailsSubmitError.set(
            'N\u00e3o foi poss\u00edvel enviar os arquivos agora. Tente novamente.'
          );
        }
      });
  }

  deletePropertyAttachment(attachmentId: number): void {
    const property = this.propertyPendingMedia();
    if (!property || this.deletingAttachmentIds().includes(attachmentId)) {
      return;
    }

    this.deletingAttachmentIds.update(current => [...current, attachmentId]);
    this.detailsSubmitError.set('');

    this.propertyListingsService
      .deleteAttachment(property.id, attachmentId)
      .pipe(finalize(() => {
        this.deletingAttachmentIds.update(current => current.filter(id => id !== attachmentId));
      }))
      .subscribe({
        next: () => {
          this.propertyDetails.update(current => current
            ? {
                ...current,
                attachments: current.attachments.filter(attachment => attachment.id !== attachmentId)
              }
            : current);
          this.loadFavorites();
        },
        error: () => {
          this.detailsSubmitError.set(
            'N\u00e3o foi poss\u00edvel remover o arquivo agora. Tente novamente.'
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
            'N\u00e3o foi poss\u00edvel carregar a an\u00e1lise SWOT agora. Tente novamente.'
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
          this.loadFavorites();
          if (this.activeSection() === 'detalhe') {
            this.openPropertyDetailById(property.id);
          }
          this.isSwotModalOpen.set(false);
          this.propertyPendingSwot.set(null);
        },
        error: () => {
          this.swotSubmitError.set(
            'N\u00e3o foi poss\u00edvel salvar a an\u00e1lise SWOT agora. Tente novamente.'
          );
        }
      });
  }

  updatePropertyStatus(property: PropertyListing, status: PropertySwotStatus): void {
    if (this.updatingStatusIds().includes(property.id)) {
      return;
    }

    const reason = status === 'Descartado'
      ? window.prompt('Informe o motivo do descarte deste imóvel:')?.trim()
      : '';

    if (status === 'Descartado' && !reason) {
      return;
    }

    this.updatingStatusIds.update(current => [...current, property.id]);

    this.propertyListingsService
      .updateStatus(property.id, status, reason ?? '')
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
          this.loadFavorites();
          if (this.activeSection() === 'detalhe') {
            this.openPropertyDetailById(updatedProperty.id);
          }
        },
        error: () => {
          this.loadError.set('N\u00e3o foi poss\u00edvel atualizar o status agora. Tente novamente.');
        }
      });
  }

  togglePropertyFavorite(property: PropertyListing): void {
    if (this.updatingStatusIds().includes(property.id)) {
      return;
    }

    this.updatingStatusIds.update(current => [...current, property.id]);

    this.propertyListingsService
      .updateFavorite(property.id, !property.isFavorite)
      .pipe(finalize(() => {
        this.updatingStatusIds.update(current => current.filter(id => id !== property.id));
      }))
      .subscribe({
        next: updatedProperty => {
          this.pageData.update(current => ({
            ...current,
            items: current.items.map(item => item.id === updatedProperty.id ? updatedProperty : item)
          }));

          this.mapItems.update(current => current.map(item => item.id === updatedProperty.id
            ? updatedProperty
            : item));

          this.propertyPendingSwot.update(current => current && current.id === updatedProperty.id
            ? updatedProperty
            : current);

          this.loadFavorites();
          if (this.activeSection() === 'detalhe') {
            this.openPropertyDetailById(updatedProperty.id);
          }
        },
        error: () => {
          this.loadError.set('N\u00e3o foi poss\u00edvel atualizar o favorito agora. Tente novamente.');
        }
      });
  }

  togglePropertyFavoriteById(propertyId: number): void {
    const property = this.findPropertyById(propertyId);
    if (property) {
      this.togglePropertyFavorite(property);
    }
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
          this.loadFavorites();

          const currentPage = this.pageData().page;
          const remainingItems = this.pageData().items.length - 1;
          const targetPage = remainingItems <= 0 && currentPage > 1 ? currentPage - 1 : currentPage;

          this.refreshData(targetPage);
        },
        error: () => {
          this.deleteError.set(
            'N\u00e3o foi poss\u00edvel excluir o registro agora. Tente novamente.'
          );
        }
      });
  }

  private refreshData(page: number): void {
    this.loadPage(page);
    this.loadMap();
  }

  openMediaModalById(propertyId: number): void {
    const property = this.findPropertyById(propertyId);
    if (property) {
      this.openMediaModal(property);
    }
  }

  openSwotModalById(propertyId: number): void {
    const property = this.findPropertyById(propertyId);
    if (property) {
      this.openSwotModal(property);
    }
  }

  private loadInconsistenciesSummary(): void {
    this.propertyInconsistenciesService.getSummary().subscribe({
      next: summary => this.inconsistenciesSummary.set(summary),
      error: () => {
        this.inconsistenciesSummary.set({
          totalCount: 0,
          affectedProperties: 0,
          highSeverityCount: 0,
          mediumSeverityCount: 0,
          lowSeverityCount: 0,
          generatedAtUtc: new Date().toISOString()
        });
      }
    });
  }

  private loadInconsistencies(): void {
    this.isInconsistenciesLoading.set(true);
    this.inconsistenciesLoadError.set('');

    this.propertyInconsistenciesService
      .getAll()
      .pipe(finalize(() => this.isInconsistenciesLoading.set(false)))
      .subscribe({
        next: response => this.applyInconsistencyResponse(response),
        error: () => {
          this.inconsistenciesLoadError.set(
            'N\u00e3o foi poss\u00edvel carregar as inconsist\u00eancias agora. Tente novamente.'
          );
        }
      });
  }

  private applyInconsistencyResponse(response: PropertyInconsistenciesResponse): void {
    this.inconsistenciesSummary.set(response.summary);
    this.inconsistencyItems.set(response.items);
  }

  private startInconsistencyRealtime(): void {
    const connection = this.propertyInconsistenciesService.createConnection();
    this.inconsistencyConnection = connection;

    connection.on('inconsistenciesSummaryUpdated', (summary: PropertyInconsistencySummary) => {
      this.inconsistenciesSummary.set(summary);

      if (this.activeSection() === 'inconsistencias') {
        this.loadInconsistencies();
      }

      this.loadFavorites();
    });

    connection.on('propertyCreated', (_event: { propertyId: number; title: string }) => {
      if (this.activeSection() === 'inicio') {
        this.refreshDataFromRealtime();
      }

      if (this.activeSection() === 'inconsistencias') {
        this.loadInconsistencies();
      }
    });

    void connection.start().catch(() => {
      this.loadInconsistenciesSummary();
    });
  }

  private refreshDataFromRealtime(): void {
    if (this.isRefreshingFromRealtime) {
      return;
    }

    this.isRefreshingFromRealtime = true;

    this.refreshData(1);

    window.setTimeout(() => {
      this.isRefreshingFromRealtime = false;
    }, 1200);
  }

  private resetMediaModalState(): void {
    this.isMediaModalOpen.set(false);
    this.propertyPendingMedia.set(null);
    this.propertyDetails.set(null);
    this.detailsLoadError.set('');
    this.detailsSubmitError.set('');
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

  private loadSettings(): void {
    this.isSettingsLoading.set(true);
    this.settingsLoadError.set('');

    this.appSettingsService
      .getSettings()
      .pipe(finalize(() => this.isSettingsLoading.set(false)))
      .subscribe({
        next: settings => {
          this.applySettings(settings);
          this.loadFilterOptions();
          this.refreshData(1);
          this.loadFavorites();
          this.loadInconsistenciesSummary();
        },
        error: () => {
          this.settingsLoadError.set('Não foi possível carregar as configurações do sistema.');
          this.loadFilterOptions();
          this.refreshData(1);
          this.loadFavorites();
          this.loadInconsistenciesSummary();
        }
      });
  }

  private loadFavorites(): void {
    this.isFavoritesLoading.set(true);
    this.favoritesLoadError.set('');

    this.propertyListingsService
      .getFavorites(
        this.favoriteFilters(),
        this.favoriteSortBy(),
        this.favoritesPage(),
        this.favoritesPageSize())
      .pipe(finalize(() => this.isFavoritesLoading.set(false)))
      .subscribe({
        next: response => {
          this.favoritesData.set(response);
          this.favoritesPage.set(response.page);
        },
        error: () => {
          this.favoritesLoadError.set(
            'N\u00e3o foi poss\u00edvel carregar os favoritos agora. Tente novamente.'
          );
        }
      });
  }

  private loadCompareDetails(): void {
    const ids = this.comparePropertyIds();
    if (ids.length === 0) {
      this.compareDetails.set([]);
      return;
    }

    this.isCompareLoading.set(true);
    this.compareLoadError.set('');

    Promise.all(ids.map(id => firstValueFrom(this.propertyListingsService.getDetails(id))))
      .then(results => {
        this.compareDetails.set(results.filter((item): item is PropertyDetails => Boolean(item)));
      })
      .catch(() => {
        this.compareLoadError.set('Não foi possível montar a comparação agora.');
      })
      .finally(() => {
        this.isCompareLoading.set(false);
      });
  }

  private applySettings(settings: AppSettings): void {
    this.appSettings.set(settings);
    this.favoriteSortBy.set(settings.favoritesSortBy);
    this.favoritesPageSize.set(settings.favoritesPageSize);
    this.pageData.update(current => ({
      ...current,
      pageSize: settings.listingsPageSize
    }));
  }

  private findPropertyById(propertyId: number): PropertyListing | null {
    const fromPage = this.pageData().items.find(item => item.id === propertyId);
    if (fromPage) {
      return fromPage;
    }

    const fromMap = this.mapItems().find(item => item.id === propertyId);
    if (fromMap) {
      return fromMap;
    }

    const fromFavorites = this.favoritesData()?.items.find(item => item.id === propertyId);
    if (fromFavorites) {
      return {
        id: fromFavorites.id,
        title: fromFavorites.title,
        category: fromFavorites.category,
        source: fromFavorites.source,
        originalUrl: fromFavorites.originalUrl,
        swotStatus: fromFavorites.swotStatus,
        price: fromFavorites.price,
        condoFee: null,
        iptu: null,
        insurance: null,
        upfrontCost: null,
        addressLine: fromFavorites.addressLine,
        neighborhood: fromFavorites.neighborhood,
        city: fromFavorites.city,
        state: fromFavorites.state,
        postalCode: '',
        latitude: fromFavorites.latitude,
        longitude: fromFavorites.longitude,
        hasExactLocation: fromFavorites.hasExactLocation,
        strengths: fromFavorites.strengthsPreview,
        weaknesses: '',
        opportunities: '',
        threats: fromFavorites.threatsPreview,
        score: fromFavorites.score,
        notes: '',
        discardReason: '',
        isFavorite: true,
        excluded: false,
        createdAtUtc: fromFavorites.createdAtUtc
      };
    }

    const fromDetails = this.selectedPropertyDetails();
    if (fromDetails && fromDetails.propertyId === propertyId) {
      return {
        id: fromDetails.propertyId,
        title: fromDetails.title,
        category: fromDetails.category,
        source: fromDetails.source as PropertyListing['source'],
        originalUrl: fromDetails.originalUrl,
        swotStatus: fromDetails.swotStatus as PropertyListing['swotStatus'],
        price: fromDetails.price,
        condoFee: fromDetails.condoFee,
        iptu: fromDetails.iptu,
        insurance: fromDetails.insurance,
        upfrontCost: fromDetails.upfrontCost,
        addressLine: fromDetails.addressLine,
        neighborhood: fromDetails.neighborhood,
        city: fromDetails.city,
        state: fromDetails.state,
        postalCode: fromDetails.postalCode,
        latitude: fromDetails.latitude,
        longitude: fromDetails.longitude,
        hasExactLocation: fromDetails.hasExactLocation,
        strengths: fromDetails.strengths,
        weaknesses: fromDetails.weaknesses,
        opportunities: fromDetails.opportunities,
        threats: fromDetails.threats,
        score: fromDetails.score,
        notes: fromDetails.notes,
        discardReason: fromDetails.discardReason,
        isFavorite: fromDetails.isFavorite,
        excluded: false,
        createdAtUtc: fromDetails.createdAtUtc
      };
    }

    return null;
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

  private scheduleHighlightedPropertyScroll(): void {
    if (
      this.activeSection() !== 'inicio' ||
      this.activeView() !== 'list' ||
      this.highlightedPropertyId() === null
    ) {
      return;
    }

    this.scrollToHighlightedRowAttempts = 0;
    this.scrollHighlightedPropertyIntoView();
  }

  private scrollHighlightedPropertyIntoView(): void {
    const highlightedRow = document.querySelector<HTMLElement>('.property-row--highlighted');

    if (highlightedRow) {
      highlightedRow.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });

      return;
    }

    if (this.scrollToHighlightedRowAttempts >= 8 || this.highlightedPropertyId() === null) {
      return;
    }

    this.scrollToHighlightedRowAttempts += 1;
    window.setTimeout(() => this.scrollHighlightedPropertyIntoView(), 80);
  }
}
