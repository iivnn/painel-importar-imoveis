import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dashboard-summary-header',
  standalone: true,
  templateUrl: './dashboard-summary-header.component.html',
  styleUrl: './dashboard-summary-header.component.css'
})
export class DashboardSummaryHeaderComponent {
  readonly totalItems = input(0);
  readonly page = input(1);
  readonly totalPages = input(0);
  readonly pageSize = input(10);
}
