import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-clear-logs-modal',
  standalone: true,
  templateUrl: './confirm-clear-logs-modal.component.html',
  styleUrl: './confirm-clear-logs-modal.component.css'
})
export class ConfirmClearLogsModalComponent {
  readonly isClearing = input(false);
  readonly errorMessage = input('');

  readonly cancel = output<void>();
  readonly confirm = output<void>();
}
