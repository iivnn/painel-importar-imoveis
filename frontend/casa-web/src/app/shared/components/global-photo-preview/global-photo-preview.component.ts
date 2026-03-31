import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';

import { PhotoPreviewService } from '../../../core/services/photo-preview.service';

@Component({
  selector: 'app-global-photo-preview',
  standalone: true,
  templateUrl: './global-photo-preview.component.html',
  styleUrl: './global-photo-preview.component.css'
})
export class GlobalPhotoPreviewComponent implements OnInit, OnDestroy {
  readonly photoPreviewService = inject(PhotoPreviewService);
  private autoplayId: number | null = null;

  ngOnInit(): void {
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  activePhotoUrl(): string {
    const state = this.photoPreviewService.state();
    return state.photoUrls[state.activeIndex] || '';
  }

  photoCounterLabel(): string {
    const state = this.photoPreviewService.state();

    if (!state.photoUrls.length) {
      return 'Sem fotos';
    }

    return `${state.activeIndex + 1} de ${state.photoUrls.length}`;
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  handleViewportChange(): void {
    this.photoPreviewService.hide();
  }

  private startAutoplay(): void {
    this.stopAutoplay();
    this.autoplayId = window.setInterval(() => {
      const state = this.photoPreviewService.state();

      if (state.visible && !state.loading && state.photoUrls.length > 1) {
        this.photoPreviewService.next();
      }
    }, 2200);
  }

  private stopAutoplay(): void {
    if (this.autoplayId !== null) {
      window.clearInterval(this.autoplayId);
      this.autoplayId = null;
    }
  }
}
