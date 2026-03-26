import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AddressLookupService } from '../address-lookup.service';
import { CepLookupResult, CreatePropertyRequest, PropertySource } from '../create-property.model';

type EditableField =
  | 'title'
  | 'category'
  | 'originalUrl'
  | 'addressLine'
  | 'neighborhood'
  | 'city'
  | 'state'
  | 'postalCode';

@Component({
  selector: 'app-create-property-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-property-modal.component.html',
  styleUrl: './create-property-modal.component.css'
})
export class CreatePropertyModalComponent {
  private readonly addressLookupService = inject(AddressLookupService);

  readonly sourceOptions: { value: PropertySource; label: string }[] = [
    { value: 'AppExterno', label: 'App externo' },
    { value: 'PortalWeb', label: 'Portal web' },
    { value: 'Indicacao', label: 'Indicacao' },
    { value: 'Corretor', label: 'Corretor' },
    { value: 'Outro', label: 'Outro' }
  ];

  readonly isSaving = input(false);
  readonly submitError = input('');

  readonly cancel = output<void>();
  readonly save = output<CreatePropertyRequest>();

  readonly form = signal<CreatePropertyRequest>({
    title: '',
    category: '',
    source: 'AppExterno',
    originalUrl: '',
    swotStatus: 'Novo',
    price: null,
    addressLine: '',
    neighborhood: '',
    city: '',
    state: '',
    postalCode: '',
    latitude: null,
    longitude: null,
    hasExactLocation: true,
    excluded: false
  });

  readonly isCepLoading = signal(false);
  readonly cepError = signal('');

  readonly canSubmit = computed(() => {
    const value = this.form();

    return Boolean(
      value.title.trim() &&
      value.category.trim() &&
      value.addressLine.trim() &&
      value.neighborhood.trim() &&
      value.city.trim() &&
      value.state.trim() &&
      value.postalCode.trim()
    );
  });

  updateField(field: EditableField, value: string): void {
    this.form.update(current => ({
      ...current,
      [field]: field === 'postalCode' ? this.normalizeCep(value) : value
    }));

    if (field === 'postalCode') {
      this.cepError.set('');
    }
  }

  updateSource(value: PropertySource): void {
    this.form.update(current => ({
      ...current,
      source: value
    }));
  }

  updateNumber(field: 'price' | 'latitude' | 'longitude', value: string): void {
    const parsedValue = value.trim() === '' ? null : Number(value);

    this.form.update(current => ({
      ...current,
      [field]: Number.isNaN(parsedValue) ? null : parsedValue
    }));
  }

  updateBoolean(field: 'hasExactLocation', value: boolean): void {
    this.form.update(current => ({
      ...current,
      [field]: value
    }));
  }

  lookupCep(): void {
    const normalizedCep = this.form().postalCode.replace(/\D/g, '');
    if (normalizedCep.length !== 8 || this.isCepLoading()) {
      return;
    }

    this.isCepLoading.set(true);
    this.cepError.set('');

    this.addressLookupService
      .lookupByCep(normalizedCep)
      .pipe(finalize(() => this.isCepLoading.set(false)))
      .subscribe({
        next: response => this.applyCepLookup(response),
        error: () => {
          this.cepError.set('Nao foi possivel localizar o CEP informado.');
        }
      });
  }

  submit(): void {
    if (!this.canSubmit() || this.isSaving() || this.isCepLoading()) {
      return;
    }

    const value = this.form();

    this.save.emit({
      ...value,
      title: value.title.trim(),
      category: value.category.trim(),
      originalUrl: value.originalUrl.trim(),
      addressLine: value.addressLine.trim(),
      neighborhood: value.neighborhood.trim(),
      city: value.city.trim(),
      state: value.state.trim().toUpperCase(),
      postalCode: this.normalizeCep(value.postalCode)
    });
  }

  private applyCepLookup(response: CepLookupResult): void {
    this.form.update(current => ({
      ...current,
      postalCode: this.normalizeCep(response.postalCode),
      addressLine: response.street || current.addressLine,
      neighborhood: response.neighborhood || current.neighborhood,
      city: response.city || current.city,
      state: response.state || current.state
    }));
  }

  private normalizeCep(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8);

    if (digits.length <= 5) {
      return digits;
    }

    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
}
