import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { PropertySwotStatus } from '../create-property.model';
import { PropertyListing, PropertyListingPage } from '../property-listing.model';
import { MapTooltipButtonComponent } from './map-tooltip-button.component';

@Component({
  selector: 'app-property-listings-table',
  standalone: true,
  imports: [DecimalPipe, MapTooltipButtonComponent],
  templateUrl: './property-listings-table.component.html',
  styleUrl: './property-listings-table.component.css'
})
export class PropertyListingsTableComponent {
  readonly statusOptions: { value: PropertySwotStatus; label: string }[] = [
    { value: 'Novo', label: 'Novo' },
    { value: 'EmAnalise', label: 'Em analise' },
    { value: 'Visitado', label: 'Visitado' },
    { value: 'Proposta', label: 'Proposta' },
    { value: 'Favorito', label: 'Favorito' },
    { value: 'Descartado', label: 'Descartado' }
  ];

  readonly pageData = input<PropertyListingPage>({
    items: [],
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  });

  readonly isLoading = input(false);
  readonly loadError = input('');
  readonly updatingStatusIds = input<number[]>([]);

  readonly previousPage = output<void>();
  readonly nextPage = output<void>();
  readonly requestSwot = output<PropertyListing>();
  readonly requestDelete = output<PropertyListing>();
  readonly requestStatusChange = output<{ property: PropertyListing; status: PropertySwotStatus }>();

  displayedRangeStart(): number {
    const data = this.pageData();

    return data.totalItems > 0 ? ((data.page - 1) * data.pageSize) + 1 : 0;
  }

  displayedRangeEnd(): number {
    const { page, pageSize, totalItems } = this.pageData();

    return Math.min(page * pageSize, totalItems);
  }

  trackByPropertyId(_: number, property: PropertyListing): number {
    return property.id;
  }

  emitStatusChange(property: PropertyListing, event: Event): void {
    const status = (event.target as HTMLSelectElement | null)?.value as PropertySwotStatus | undefined;
    if (!status || status === property.swotStatus) {
      return;
    }

    this.requestStatusChange.emit({ property, status });
  }

  isUpdatingStatus(propertyId: number): boolean {
    return this.updatingStatusIds().includes(propertyId);
  }
}
