import { Component, inject, input } from '@angular/core';

import { MapPreviewService } from '../../../../core/services/map-preview.service';

@Component({
  selector: 'app-map-tooltip-button',
  standalone: true,
  templateUrl: './map-tooltip-button.component.html',
  styleUrl: './map-tooltip-button.component.css'
})
export class MapTooltipButtonComponent {
  private readonly mapPreviewService = inject(MapPreviewService);

  readonly latitude = input<number | null>(null);
  readonly longitude = input<number | null>(null);
  readonly hasExactLocation = input(false);

  googleMapsUrl(): string {
    if (this.latitude() === null || this.longitude() === null) {
      return '#';
    }

    return `https://www.google.com/maps?q=${this.latitude()},${this.longitude()}`;
  }

  showPreview(): void {
    this.mapPreviewService.show(this.latitude(), this.longitude(), this.hasExactLocation());
  }

  hidePreview(): void {
    this.mapPreviewService.hide();
  }
}
