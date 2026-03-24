import { Component, HostListener, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-map-tooltip-button',
  standalone: true,
  templateUrl: './map-tooltip-button.component.html',
  styleUrl: './map-tooltip-button.component.css'
})
export class MapTooltipButtonComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly latitude = input<number | null>(null);
  readonly longitude = input<number | null>(null);
  readonly hasExactLocation = input(false);

  readonly isPreviewVisible = signal(false);
  readonly previewTop = signal(0);
  readonly previewLeft = signal(0);

  googleMapsUrl(): string {
    if (this.latitude() === null || this.longitude() === null) {
      return '#';
    }

    return `https://www.google.com/maps?q=${this.latitude()},${this.longitude()}`;
  }

  coordinatesLabel(): string {
    if (this.latitude() === null || this.longitude() === null) {
      return 'Coordenadas indisponíveis';
    }

    return `${this.latitude()}, ${this.longitude()}`;
  }

  googleMapsEmbedUrl(): SafeResourceUrl {
    if (this.latitude() === null || this.longitude() === null) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    }

    const url = `https://www.google.com/maps?q=${this.latitude()},${this.longitude()}&z=13&output=embed`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  showPreview(event: MouseEvent | FocusEvent): void {
    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const previewWidth = 800;
    const previewHeight = 700;
    const spacing = 12;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = rect.left + rect.width / 2 - previewWidth / 2;
    let top = rect.top - previewHeight - spacing;

    if (left < 12) {
      left = 12;
    }

    if (left + previewWidth > viewportWidth - 12) {
      left = viewportWidth - previewWidth - 12;
    }

    if (top < 12) {
      top = Math.min(rect.bottom + spacing, viewportHeight - previewHeight - 12);
    }

    this.previewLeft.set(left);
    this.previewTop.set(top);
    this.isPreviewVisible.set(true);
  }

  hidePreview(): void {
    this.isPreviewVisible.set(false);
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  handleViewportChange(): void {
    this.isPreviewVisible.set(false);
  }
}
