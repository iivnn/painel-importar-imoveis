import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  AppLogFilters,
  AppLogLevel,
  AppLogPage,
  AppLogSource,
  AppLogSummary,
  EMPTY_APP_LOG_FILTERS
} from '../../models/app-log.model';

@Component({
  selector: 'app-logs-panel',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './app-logs-panel.component.html',
  styleUrl: './app-logs-panel.component.css'
})
export class AppLogsPanelComponent {
  @Input({ required: true }) summary: AppLogSummary | null = null;
  @Input({ required: true }) pageData: AppLogPage | null = null;
  @Input({ required: true }) filters: AppLogFilters = EMPTY_APP_LOG_FILTERS;
  @Input({ required: true }) isLoading = false;
  @Input({ required: true }) loadError = '';

  @Output() readonly applyFilters = new EventEmitter<AppLogFilters>();
  @Output() readonly clearFilters = new EventEmitter<void>();
  @Output() readonly previousPage = new EventEmitter<void>();
  @Output() readonly nextPage = new EventEmitter<void>();
  @Output() readonly refresh = new EventEmitter<void>();

  readonly sourceOptions: AppLogSource[] = ['Backend', 'Frontend', 'Extension'];
  readonly levelOptions: AppLogLevel[] = ['Error', 'Warning', 'Info'];

  onSourceChanged(value: string): void {
    this.applyFilters.emit({
      ...this.filters,
      source: value === 'Backend' || value === 'Frontend' || value === 'Extension' ? value : ''
    });
  }

  onLevelChanged(value: string): void {
    this.applyFilters.emit({
      ...this.filters,
      level: value === 'Info' || value === 'Warning' || value === 'Error' ? value : ''
    });
  }

  onSearchChanged(value: string): void {
    this.applyFilters.emit({
      ...this.filters,
      search: value
    });
  }

  trackByLogId(index: number, item: AppLogPage['items'][number]): number {
    return item.id;
  }

  getLevelBadgeClass(level: AppLogLevel): string {
    switch (level) {
      case 'Error':
        return 'app-badge app-badge--danger';
      case 'Warning':
        return 'app-badge app-badge--warning';
      default:
        return 'app-badge app-badge--info';
    }
  }

  getSourceBadgeClass(source: AppLogSource): string {
    switch (source) {
      case 'Backend':
        return 'app-badge app-badge--neutral';
      case 'Frontend':
        return 'app-badge app-badge--success';
      default:
        return 'app-badge app-badge--warning';
    }
  }
}
