import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'casa-theme';

  readonly theme = signal<AppTheme>('light');

  constructor() {
    const savedTheme = this.readSavedTheme();
    const initialTheme = savedTheme ?? this.getPreferredTheme();

    this.setTheme(initialTheme);
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private setTheme(theme: AppTheme): void {
    this.theme.set(theme);
    this.document.documentElement.dataset['theme'] = theme;
    localStorage.setItem(this.storageKey, theme);
  }

  private readSavedTheme(): AppTheme | null {
    const savedTheme = localStorage.getItem(this.storageKey);

    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null;
  }

  private getPreferredTheme(): AppTheme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
