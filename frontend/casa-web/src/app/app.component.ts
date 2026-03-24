import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

import { DashboardSummaryHeaderComponent } from './components/dashboard-summary-header.component';
import { PropertyListingsTableComponent } from './components/property-listings-table.component';
import { PropertyListingPage } from './property-listing.model';
import { PropertyListingsService } from './property-listings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DashboardSummaryHeaderComponent, PropertyListingsTableComponent],
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
        next: (response) => this.pageData.set(response),
        error: () => {
          this.loadError.set(
            'Não foi possível carregar os imóveis. Verifique se a API local está em execução.'
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
}
