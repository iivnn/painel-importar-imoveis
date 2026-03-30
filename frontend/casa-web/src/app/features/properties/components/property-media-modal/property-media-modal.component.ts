import { Component, effect, input, output, signal } from '@angular/core';

import {
  PropertyAttachment,
  PropertyAttachmentKind,
  PropertyDetails
} from '../../models/property-details.model';

@Component({
  selector: 'app-property-media-modal',
  standalone: true,
  templateUrl: './property-media-modal.component.html',
  styleUrl: './property-media-modal.component.css'
})
export class PropertyMediaModalComponent {
  readonly propertyTitle = input('');
  readonly details = input<PropertyDetails | null>(null);
  readonly isLoading = input(false);
  readonly isSavingNotes = input(false);
  readonly activeUploadKind = input<PropertyAttachmentKind | null>(null);
  readonly deletingAttachmentIds = input<number[]>([]);
  readonly loadError = input('');
  readonly submitError = input('');

  readonly cancel = output<void>();
  readonly saveNotes = output<string>();
  readonly uploadAttachments = output<{ kind: PropertyAttachmentKind; files: File[] }>();
  readonly deleteAttachment = output<number>();

  readonly notesDraft = signal('');

  constructor() {
    effect(() => {
      this.notesDraft.set(this.details()?.notes ?? '');
    }, { allowSignalWrites: true });
  }

  photos(): PropertyAttachment[] {
    return (this.details()?.attachments ?? []).filter(attachment => attachment.kind === 'Foto');
  }

  prints(): PropertyAttachment[] {
    return (this.details()?.attachments ?? []).filter(attachment => attachment.kind === 'Print');
  }

  updateNotes(value: string): void {
    this.notesDraft.set(value);
  }

  isBusy(): boolean {
    return this.isLoading()
      || this.isSavingNotes()
      || this.activeUploadKind() !== null
      || this.deletingAttachmentIds().length > 0;
  }

  busyTitle(): string {
    if (this.isLoading()) {
      return 'Carregando conte\u00fado...';
    }

    if (this.isSavingNotes()) {
      return 'Salvando observa\u00e7\u00f5es...';
    }

    if (this.activeUploadKind() === 'Foto') {
      return 'Enviando fotos...';
    }

    if (this.activeUploadKind() === 'Print') {
      return 'Enviando prints...';
    }

    if (this.deletingAttachmentIds().length > 0) {
      return 'Removendo arquivo...';
    }

    return 'Processando...';
  }

  busyDescription(): string {
    if (this.isSavingNotes()) {
      return 'Aguarde enquanto as observa\u00e7\u00f5es s\u00e3o gravadas.';
    }

    if (this.activeUploadKind() !== null) {
      return 'Aguarde o envio terminar para continuar.';
    }

    if (this.deletingAttachmentIds().length > 0) {
      return 'O arquivo ser\u00e1 removido em instantes.';
    }

    return 'Aguarde um instante.';
  }

  submitNotes(): void {
    if (this.isLoading() || this.isSavingNotes()) {
      return;
    }

    this.saveNotes.emit(this.notesDraft().trim());
  }

  handleFileSelection(kind: PropertyAttachmentKind, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const files = input?.files ? Array.from(input.files) : [];

    if (!files.length) {
      return;
    }

    this.uploadAttachments.emit({ kind, files });

    if (input) {
      input.value = '';
    }
  }

  isDeletingAttachment(attachmentId: number): boolean {
    return this.deletingAttachmentIds().includes(attachmentId);
  }
}
