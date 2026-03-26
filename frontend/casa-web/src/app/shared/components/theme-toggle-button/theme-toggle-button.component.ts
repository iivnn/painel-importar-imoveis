import { Component, inject } from '@angular/core';

import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle-button',
  standalone: true,
  templateUrl: './theme-toggle-button.component.html',
  styleUrl: './theme-toggle-button.component.css'
})
export class ThemeToggleButtonComponent {
  readonly themeService = inject(ThemeService);
}
