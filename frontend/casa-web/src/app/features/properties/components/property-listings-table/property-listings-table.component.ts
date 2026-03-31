import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { PropertySwotStatus } from '../../models/create-property.model';
import { PropertyListing, PropertyListingPage } from '../../models/property-listing.model';
import { MapTooltipButtonComponent } from '../map-tooltip-button/map-tooltip-button.component';
import { PhotoPreviewButtonComponent } from '../photo-preview-button/photo-preview-button.component';

@Component({
  selector: 'app-property-listings-table',
  standalone: true,
  imports: [DecimalPipe, MapTooltipButtonComponent, PhotoPreviewButtonComponent],
  templateUrl: './property-listings-table.component.html',
  styleUrl: './property-listings-table.component.css'
})
export class PropertyListingsTableComponent {
  readonly statusOptions: { value: PropertySwotStatus; label: string }[] = [
    { value: 'Novo', label: 'Novo' },
    { value: 'EmAnalise', label: 'Em an\u00e1lise' },
    { value: 'Visitado', label: 'Visitado' },
    { value: 'Proposta', label: 'Proposta' },
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
  readonly highlightedPropertyId = input<number | null>(null);
  readonly comparedPropertyIds = input<number[]>([]);

  readonly previousPage = output<void>();
  readonly nextPage = output<void>();
  readonly requestSwot = output<PropertyListing>();
  readonly requestMedia = output<PropertyListing>();
  readonly requestDetail = output<PropertyListing>();
  readonly requestEdit = output<PropertyListing>();
  readonly requestDelete = output<PropertyListing>();
  readonly toggleCompare = output<PropertyListing>();
  readonly requestFavoriteToggle = output<PropertyListing>();
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

  isHighlighted(propertyId: number): boolean {
    return this.highlightedPropertyId() === propertyId;
  }

  isCompared(propertyId: number): boolean {
    return this.comparedPropertyIds().includes(propertyId);
  }

  getMonthlyTotal(property: PropertyListing): number | null {
    const values = [
      property.price,
      property.condoFee,
      property.iptu,
      property.insurance,
      property.serviceFee
    ];

    const hasAnyValue = values.some(value => value !== null && value !== undefined);
    if (!hasAnyValue) {
      return null;
    }

    return values.reduce<number>((total, value) => total + (value ?? 0), 0);
  }

  isFromQuintoAndar(property: PropertyListing): boolean {
    return this.getListingHost(property).includes('quintoandar.com.br');
  }

  isFromVivaReal(property: PropertyListing): boolean {
    return this.getListingHost(property).includes('vivareal.com.br');
  }

  isFromZapImoveis(property: PropertyListing): boolean {
    return this.getListingHost(property).includes('zapimoveis.com.br');
  }

  isFromImovelweb(property: PropertyListing): boolean {
    return this.getListingHost(property).includes('imovelweb.com.br');
  }

  isFromNetimoveis(property: PropertyListing): boolean {
    return this.getListingHost(property).includes('netimoveis.com');
  }

  isFromOlx(property: PropertyListing): boolean {
    return this.getListingHost(property).includes('olx.com.br');
  }

  getSourceBadgeClass(property: PropertyListing): string {
    if (this.isFromQuintoAndar(property)) {
      return 'listing-source-badge--quintoandar';
    }

    if (this.isFromVivaReal(property)) {
      return 'listing-source-badge--vivareal';
    }

    if (this.isFromZapImoveis(property)) {
      return 'listing-source-badge--zapimoveis';
    }

    if (this.isFromImovelweb(property)) {
      return 'listing-source-badge--imovelweb';
    }

    if (this.isFromNetimoveis(property)) {
      return 'listing-source-badge--netimoveis';
    }

    if (this.isFromOlx(property)) {
      return 'listing-source-badge--olx';
    }

    return '';
  }

  getSourceIcon(property: PropertyListing): string {
    if (this.isFromQuintoAndar(property)) {
      return 'bi-building-check';
    }

    if (this.isFromVivaReal(property)) {
      return 'bi-house-door-fill';
    }

    if (this.isFromZapImoveis(property)) {
      return 'bi-buildings-fill';
    }

    if (this.isFromImovelweb(property)) {
      return 'bi-house-gear-fill';
    }

    if (this.isFromNetimoveis(property)) {
      return 'bi-house-lock-fill';
    }

    if (this.isFromOlx(property)) {
      return 'bi-shop';
    }

    return 'bi-link-45deg';
  }

  getSourceTooltip(property: PropertyListing): string {
    if (this.isFromQuintoAndar(property)) {
      return 'Anuncio importado do QuintoAndar';
    }

    if (this.isFromVivaReal(property)) {
      return 'Anuncio importado da Viva Real';
    }

    if (this.isFromZapImoveis(property)) {
      return 'Anuncio importado do Zap Imoveis';
    }

    if (this.isFromImovelweb(property)) {
      return 'Anuncio importado do Imovelweb';
    }

    if (this.isFromNetimoveis(property)) {
      return 'Anuncio importado da Netimoveis';
    }

    if (this.isFromOlx(property)) {
      return 'Anuncio importado da OLX';
    }

    return property.source;
  }

  private getListingHost(property: PropertyListing): string {
    const url = String(property.originalUrl || '').trim();
    if (!url) {
      return '';
    }

    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return '';
    }
  }
}
