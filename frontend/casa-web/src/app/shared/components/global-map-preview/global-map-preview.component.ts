import { Component, HostListener, computed, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { MapPreviewService } from '../../../core/services/map-preview.service';

@Component({
  selector: 'app-global-map-preview',
  standalone: true,
  templateUrl: './global-map-preview.component.html',
  styleUrl: './global-map-preview.component.css'
})
export class GlobalMapPreviewComponent {
  private readonly sanitizer = inject(DomSanitizer);
  readonly mapPreviewService = inject(MapPreviewService);

  readonly googleMapsEmbedUrl = computed<SafeResourceUrl>(() => {
    const state = this.mapPreviewService.state();

    if (state.latitude === null || state.longitude === null) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    }

    const url = `https://www.google.com/maps?q=${state.latitude},${state.longitude}&z=14&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  readonly coordinatesLabel = computed(() => {
    const state = this.mapPreviewService.state();

    if (state.latitude === null || state.longitude === null) {
      return 'Coordenadas indisponiveis';
    }

    return `${state.latitude}, ${state.longitude}`;
  });

  @HostListener('window:scroll')
  @HostListener('window:resize')
  handleViewportChange(): void {
    this.mapPreviewService.hide();
  }
}
