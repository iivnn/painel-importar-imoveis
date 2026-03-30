import { DatePipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';

import {
  PropertyInconsistencyItem,
  PropertyInconsistencySummary
} from '../../models/property-inconsistency.model';

@Component({
  selector: 'app-property-inconsistencies-panel',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './property-inconsistencies-panel.component.html',
  styleUrl: './property-inconsistencies-panel.component.css'
})
export class PropertyInconsistenciesPanelComponent {
  readonly summary = input<PropertyInconsistencySummary | null>(null);
  readonly items = input<PropertyInconsistencyItem[]>([]);
  readonly isLoading = input(false);
  readonly loadError = input('');
  readonly dismissingIds = input<string[]>([]);
  readonly openProperty = output<number>();
  readonly dismiss = output<string>();

  readonly activeSeverity = signal<'todas' | 'alta' | 'media' | 'baixa'>('todas');
  readonly currentPage = signal(1);
  readonly pageSize = 8;
  readonly filteredItems = computed(() => {
    const severity = this.activeSeverity();
    const items = this.items();

    if (severity === 'todas') {
      return items;
    }

    return items.filter(item => item.severity === severity);
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize)));
  readonly pagedItems = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;

    return this.filteredItems().slice(start, end);
  });
  readonly currentRangeLabel = computed(() => {
    const total = this.filteredItems().length;

    if (!total) {
      return '0 de 0';
    }

    const start = (this.currentPage() - 1) * this.pageSize + 1;
    const end = Math.min(start + this.pageSize - 1, total);
    return `${start}-${end} de ${total}`;
  });

  readonly filterOptions = computed(() => {
    const items = this.items();

    return [
      { value: 'todas' as const, label: 'Todas', count: items.length },
      { value: 'alta' as const, label: 'Alta', count: items.filter(item => item.severity === 'alta').length },
      { value: 'media' as const, label: 'M\u00e9dia', count: items.filter(item => item.severity === 'media').length },
      { value: 'baixa' as const, label: 'Baixa', count: items.filter(item => item.severity === 'baixa').length }
    ];
  });

  severityLabel(severity: string): string {
    switch (severity) {
      case 'alta':
        return 'Alta';
      case 'media':
        return 'M\u00e9dia';
      case 'baixa':
        return 'Baixa';
      default:
        return severity;
    }
  }

  setSeverityFilter(severity: 'todas' | 'alta' | 'media' | 'baixa'): void {
    this.activeSeverity.set(severity);
    this.currentPage.set(1);
  }

  isDismissing(id: string): boolean {
    return this.dismissingIds().includes(id);
  }

  goToPreviousPage(): void {
    if (this.currentPage() <= 1) {
      return;
    }

    this.currentPage.update(page => page - 1);
  }

  goToNextPage(): void {
    if (this.currentPage() >= this.totalPages()) {
      return;
    }

    this.currentPage.update(page => page + 1);
  }
}
