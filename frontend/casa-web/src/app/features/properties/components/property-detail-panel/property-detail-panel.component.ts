import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { PropertyDetails } from '../../models/property-details.model';
import { MapTooltipButtonComponent } from '../map-tooltip-button/map-tooltip-button.component';

@Component({
  selector: 'app-property-detail-panel',
  standalone: true,
  imports: [DecimalPipe, DatePipe, MapTooltipButtonComponent],
  templateUrl: './property-detail-panel.component.html',
  styleUrl: './property-detail-panel.component.css'
})
export class PropertyDetailPanelComponent {
  readonly details = input<PropertyDetails | null>(null);
  readonly isLoading = input(false);
  readonly loadError = input('');

  readonly back = output<void>();
  readonly edit = output<void>();
  readonly openMedia = output<void>();
  readonly openSwot = output<void>();
  readonly toggleCompare = output<void>();

  monthlyCost(details: PropertyDetails | null): number | null {
    return details?.monthlyTotalCost ?? null;
  }
}
