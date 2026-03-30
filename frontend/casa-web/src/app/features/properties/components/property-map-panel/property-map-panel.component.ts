import { DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input
} from '@angular/core';
import * as L from 'leaflet';

import { PropertyListing } from '../../models/property-listing.model';

@Component({
  selector: 'app-property-map-panel',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './property-map-panel.component.html',
  styleUrl: './property-map-panel.component.css'
})
export class PropertyMapPanelComponent implements AfterViewInit, OnDestroy {
  readonly properties = input<PropertyListing[]>([]);
  readonly isLoading = input(false);
  readonly loadError = input('');
  readonly initialLatitude = input(-14.235);
  readonly initialLongitude = input(-51.9253);
  readonly initialZoom = input(4);
  readonly onlyExactLocation = input(false);

  @ViewChild('mapHost') private mapHost?: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private readonly markersLayer = L.layerGroup();

  constructor() {
    effect(() => {
      this.properties();

      if (this.map) {
        this.renderMarkers();
      }
    });
  }

  get totalWithCoordinates(): number {
    return this.visibleProperties().length;
  }

  ngAfterViewInit(): void {
    const host = this.mapHost?.nativeElement;
    if (!host) {
      return;
    }

    this.map = L.map(host, {
      zoomControl: true,
      attributionControl: true
    }).setView([this.initialLatitude(), this.initialLongitude()], this.initialZoom());

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);
    this.renderMarkers();

    queueMicrotask(() => this.map?.invalidateSize());
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private renderMarkers(): void {
    if (!this.map) {
      return;
    }

    this.markersLayer.clearLayers();

    const points = this.visibleProperties()
      .map(property => {
        const marker = L.circleMarker([property.latitude!, property.longitude!], {
          radius: 8,
          weight: 2,
          color: '#9c7447',
          fillColor: '#c8a16a',
          fillOpacity: 0.9
        });

        marker.bindPopup(this.buildPopupContent(property), {
          maxWidth: 320
        });

        this.markersLayer.addLayer(marker);

        return L.latLng(property.latitude!, property.longitude!);
      });

    if (!points.length) {
      this.map.setView([this.initialLatitude(), this.initialLongitude()], this.initialZoom());
      return;
    }

    this.map.fitBounds(L.latLngBounds(points), {
      padding: [36, 36],
      maxZoom: 13
    });
  }

  private buildPopupContent(property: PropertyListing): string {
    const price = property.price === null
      ? 'N\u00e3o informado'
      : new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(property.price);

    const score = property.score === null ? 'Sem nota' : `${property.score.toFixed(1)} / 10`;
    const location = `${property.neighborhood} - ${property.city}/${property.state}`;
    const status = this.formatStatus(property.swotStatus);
    const link = property.originalUrl
      ? `<a href="${property.originalUrl}" target="_blank" rel="noopener noreferrer">Ver an\u00fancio</a>`
      : '<span>Sem link</span>';

    return `
      <div class="map-popup">
        <strong>${property.title}</strong>
        <span>${location}</span>
        <span>Categoria: ${property.category}</span>
        <span>Status: ${status}</span>
        ${property.isFavorite ? '<span>Finalista</span>' : ''}
        <span>Valor: ${price}</span>
        <span>Nota: ${score}</span>
        ${link}
      </div>
    `;
  }

  private formatStatus(status: PropertyListing['swotStatus']): string {
    return status === 'EmAnalise' ? 'Em an\u00e1lise' : status;
  }

  private visibleProperties(): PropertyListing[] {
    return this.properties().filter(property =>
      property.latitude !== null
      && property.longitude !== null
      && (!this.onlyExactLocation() || property.hasExactLocation));
  }
}
