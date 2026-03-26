import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-delete-modal',
  standalone: true,
  templateUrl: './confirm-delete-modal.component.html',
  styleUrl: './confirm-delete-modal.component.css'
})
export class ConfirmDeleteModalComponent {
  readonly isDeleting = input(false);
  readonly propertyTitle = input('');
  readonly errorMessage = input('');

  readonly cancel = output<void>();
  readonly confirm = output<void>();
}
