import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

import { ConfirmDeleteModalComponent } from './components/confirm-delete-modal.component';
import { CreatePropertyModalComponent } from './components/create-property-modal.component';
import { PropertyListingsTableComponent } from './components/property-listings-table.component';
import { ThemeToggleButtonComponent } from './components/theme-toggle-button.component';
import { CreatePropertyRequest } from './create-property.model';
import { PropertyListing, PropertyListingPage } from './property-listing.model';
import { PropertyListingsService } from './property-listings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    PropertyListingsTableComponent,
    ConfirmDeleteModalComponent,
    ThemeToggleButtonComponent,
    CreatePropertyModalComponent
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

  readonly isLoading = signal(false);
  readonly loadError = signal('');
  readonly isDeleteModalOpen = signal(false);
  readonly propertyPendingDelete = signal<PropertyListing | null>(null);
  readonly isDeleting = signal(false);
  readonly deleteError = signal('');
  readonly isCreateModalOpen = signal(false);
  readonly isSaving = signal(false);
  readonly createError = signal('');

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    const currentPageSize = this.pageData().pageSize;
    const nextPage = Math.max(1, page);

    this.isLoading.set(true);
    this.loadError.set('');

    this.propertyListingsService
      .getPage(nextPage, currentPageSize)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: response => this.pageData.set(response),
        error: () => {
          this.loadError.set(
            'Nao foi possivel carregar os imoveis. Verifique se a API local esta em execucao.'
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
          this.loadPage(1);
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

          const currentPage = this.pageData().page;
          const remainingItems = this.pageData().items.length - 1;
          const targetPage = remainingItems <= 0 && currentPage > 1 ? currentPage - 1 : currentPage;

          this.loadPage(targetPage);
        },
        error: () => {
          this.deleteError.set(
            'Nao foi possivel excluir o registro agora. Tente novamente.'
          );
        }
      });
  }
}
