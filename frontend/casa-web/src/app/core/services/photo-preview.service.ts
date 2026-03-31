import { Injectable, inject, signal } from '@angular/core';

import { PropertyListingsService } from './property-listings.service';

export interface PhotoPreviewState {
  visible: boolean;
  loading: boolean;
  propertyTitle: string;
  photoUrls: string[];
  activeIndex: number;
}

@Injectable({ providedIn: 'root' })
export class PhotoPreviewService {
  private readonly propertyListingsService = inject(PropertyListingsService);
  private readonly cache = new Map<number, string[]>();

  readonly state = signal<PhotoPreviewState>({
    visible: false,
    loading: false,
    propertyTitle: '',
    photoUrls: [],
    activeIndex: 0
  });

  previewProperty(propertyId: number, propertyTitle: string): void {
    const cached = this.cache.get(propertyId);

    if (cached) {
      this.state.set({
        visible: true,
        loading: false,
        propertyTitle,
        photoUrls: cached,
        activeIndex: 0
      });
      return;
    }

    this.state.set({
      visible: true,
      loading: true,
      propertyTitle,
      photoUrls: [],
      activeIndex: 0
    });

    this.propertyListingsService.getDetails(propertyId).subscribe({
      next: details => {
        const photoUrls = details.attachments
          .filter(attachment => attachment.kind === 'Foto')
          .map(attachment => attachment.fileUrl);

        this.cache.set(propertyId, photoUrls);
        this.state.set({
          visible: photoUrls.length > 0,
          loading: false,
          propertyTitle,
          photoUrls,
          activeIndex: 0
        });
      },
      error: () => {
        this.hide();
      }
    });
  }

  hide(): void {
    this.state.update(current => ({
      ...current,
      visible: false,
      loading: false
    }));
  }

  next(): void {
    this.state.update(current => {
      if (current.photoUrls.length <= 1) {
        return current;
      }

      return {
        ...current,
        activeIndex: (current.activeIndex + 1) % current.photoUrls.length
      };
    });
  }
}
