import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

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
  readonly pageData = input<PropertyListingPage>({
    items: [],
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  });

  readonly isLoading = input(false);
  readonly loadError = input('');

  readonly previousPage = output<void>();
  readonly nextPage = output<void>();
  readonly requestDelete = output<PropertyListing>();

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
}
