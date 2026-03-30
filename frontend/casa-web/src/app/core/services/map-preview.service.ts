import { Injectable, signal } from '@angular/core';

export interface MapPreviewState {
  latitude: number | null;
  longitude: number | null;
  hasExactLocation: boolean;
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class MapPreviewService {
  readonly state = signal<MapPreviewState>({
    latitude: null,
    longitude: null,
    hasExactLocation: false,
    visible: false
  });

  show(latitude: number | null, longitude: number | null, hasExactLocation: boolean): void {
    this.state.set({
      latitude,
      longitude,
      hasExactLocation,
      visible: latitude !== null && longitude !== null
    });
  }

  hide(): void {
    this.state.update(current => ({
      ...current,
      visible: false
    }));
  }
}
