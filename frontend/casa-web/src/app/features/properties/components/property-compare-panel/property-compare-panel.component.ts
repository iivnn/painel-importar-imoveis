import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { PropertyDetails } from '../../models/property-details.model';

@Component({
  selector: 'app-property-compare-panel',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './property-compare-panel.component.html',
  styleUrl: './property-compare-panel.component.css'
})
export class PropertyComparePanelComponent {
  readonly items = input<PropertyDetails[]>([]);
  readonly isLoading = input(false);
  readonly loadError = input('');

  readonly back = output<void>();
  readonly remove = output<number>();
  readonly openDetail = output<number>();

  readonly rows = [
    { key: 'price', label: 'Aluguel' },
    { key: 'monthlyTotalCost', label: 'Custo mensal total' },
    { key: 'upfrontCost', label: 'Custo inicial' },
    { key: 'swotStatus', label: 'Status' },
    { key: 'score', label: 'Nota' },
    { key: 'category', label: 'Categoria' },
    { key: 'source', label: 'Origem' },
    { key: 'neighborhood', label: 'Bairro' }
  ] as const;
}
