import { Component, inject, input } from '@angular/core';

import { PhotoPreviewService } from '../../../../core/services/photo-preview.service';

@Component({
  selector: 'app-photo-preview-button',
  standalone: true,
  templateUrl: './photo-preview-button.component.html',
  styleUrl: './photo-preview-button.component.css'
})
export class PhotoPreviewButtonComponent {
  private readonly photoPreviewService = inject(PhotoPreviewService);

  readonly propertyId = input.required<number>();
  readonly propertyTitle = input.required<string>();

  showPreview(): void {
    this.photoPreviewService.previewProperty(this.propertyId(), this.propertyTitle());
  }

  hidePreview(): void {
    this.photoPreviewService.hide();
  }
}
