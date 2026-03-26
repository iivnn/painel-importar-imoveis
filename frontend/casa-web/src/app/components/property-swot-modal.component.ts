import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PropertySwotAnalysis, SavePropertySwotRequest } from '../property-swot.model';

@Component({
  selector: 'app-property-swot-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './property-swot-modal.component.html',
  styleUrl: './property-swot-modal.component.css'
})
export class PropertySwotModalComponent {
  readonly propertyTitle = input('');
  readonly analysis = input<PropertySwotAnalysis | null>(null);
  readonly isLoading = input(false);
  readonly isSaving = input(false);
  readonly loadError = input('');
  readonly submitError = input('');

  readonly cancel = output<void>();
  readonly save = output<SavePropertySwotRequest>();

  readonly form = signal<SavePropertySwotRequest>({
    strengths: '',
    weaknesses: '',
    opportunities: '',
    threats: '',
    score: null
  });

  constructor() {
    effect(() => {
      const analysis = this.analysis();

      this.form.set({
        strengths: analysis?.strengths ?? '',
        weaknesses: analysis?.weaknesses ?? '',
        opportunities: analysis?.opportunities ?? '',
        threats: analysis?.threats ?? '',
        score: analysis?.score ?? null
      });
    }, { allowSignalWrites: true });
  }

  updateField(field: keyof SavePropertySwotRequest, value: string): void {
    this.form.update(current => ({
      ...current,
      [field]: value
    }));
  }

  readInputValue(event: Event): string {
    return (event.target as HTMLTextAreaElement | null)?.value ?? '';
  }

  updateScore(event: Event): void {
    const rawValue = (event.target as HTMLInputElement | null)?.value ?? '';
    const trimmedValue = rawValue.trim();
    const parsedValue = Number.parseFloat(trimmedValue);

    this.form.update(current => ({
      ...current,
      score: trimmedValue === ''
        ? null
        : Number.isNaN(parsedValue)
          ? current.score
          : Math.max(0, Math.min(10, parsedValue))
    }));
  }

  submit(): void {
    if (this.isLoading() || this.isSaving()) {
      return;
    }

    const value = this.form();

    this.save.emit({
      strengths: value.strengths.trim(),
      weaknesses: value.weaknesses.trim(),
      opportunities: value.opportunities.trim(),
      threats: value.threats.trim(),
      score: value.score
    });
  }
}
