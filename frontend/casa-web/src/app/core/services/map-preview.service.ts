import { Injectable, signal } from '@angular/core';

export interface MapPreviewState {
  latitude: number | null;
  longitude: number | null;
  hasExactLocation: boolean;
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class MapPreviewService {
  private hideTimerId: number | null = null;

  readonly state = signal<MapPreviewState>({
    latitude: null,
    longitude: null,
    hasExactLocation: false,
    visible: false
  });

  show(latitude: number | null, longitude: number | null, hasExactLocation: boolean): void {
    this.clearHideTimer();

    const current = this.state();
    const shouldBeVisible = latitude !== null && longitude !== null;

    if (
      current.visible === shouldBeVisible &&
      current.latitude === latitude &&
      current.longitude === longitude &&
      current.hasExactLocation === hasExactLocation
    ) {
      return;
    }

    this.state.set({
      latitude,
      longitude,
      hasExactLocation,
      visible: shouldBeVisible
    });
  }

  hide(): void {
    this.clearHideTimer();
    this.state.update(current => ({
      ...current,
      visible: false
    }));
  }

  hideWithDelay(delayMs = 120): void {
    this.clearHideTimer();
    this.hideTimerId = window.setTimeout(() => {
      this.hideTimerId = null;
      this.hide();
    }, delayMs);
  }

  private clearHideTimer(): void {
    if (this.hideTimerId !== null) {
      window.clearTimeout(this.hideTimerId);
      this.hideTimerId = null;
    }
  }
}
