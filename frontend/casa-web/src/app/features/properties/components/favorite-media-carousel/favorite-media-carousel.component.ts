import { Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-favorite-media-carousel',
  standalone: true,
  templateUrl: './favorite-media-carousel.component.html',
  styleUrl: './favorite-media-carousel.component.css'
})
export class FavoriteMediaCarouselComponent {
  readonly title = input('');
  readonly thumbnailUrls = input<string[]>([]);

  readonly activeIndex = signal(0);
  readonly visibleThumbnails = computed(() => this.thumbnailUrls().slice(0, 4));

  activeImage(): string | null {
    const items = this.thumbnailUrls();
    if (!items.length) {
      return null;
    }

    const index = Math.min(this.activeIndex(), items.length - 1);
    return items[index] ?? null;
  }

  setActive(index: number): void {
    this.activeIndex.set(index);
  }

  showPrevious(): void {
    const items = this.thumbnailUrls();
    if (!items.length) {
      return;
    }

    this.activeIndex.update(current => current === 0 ? items.length - 1 : current - 1);
  }

  showNext(): void {
    const items = this.thumbnailUrls();
    if (!items.length) {
      return;
    }

    this.activeIndex.update(current => current >= items.length - 1 ? 0 : current + 1);
  }

  isActive(index: number): boolean {
    return this.activeIndex() === index;
  }
}
