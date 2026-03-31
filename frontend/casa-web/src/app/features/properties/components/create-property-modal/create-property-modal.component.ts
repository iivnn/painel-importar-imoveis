import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AddressLookupService } from '../../../../core/services/address-lookup.service';
import {
  CepLookupResult,
  CreatePropertyRequest,
  PropertySource,
  PropertySwotStatus
} from '../../models/create-property.model';
import { PropertyListing } from '../../models/property-listing.model';
import { AppSettings } from '../../../settings/models/app-settings.model';

type EditableField =
  | 'title'
  | 'category'
  | 'originalUrl'
  | 'notes'
  | 'discardReason'
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
    { value: 'Indicacao', label: 'Indicação' },
    { value: 'Corretor', label: 'Corretor' },
    { value: 'Outro', label: 'Outro' }
  ];

  readonly statusOptions: { value: PropertySwotStatus; label: string }[] = [
    { value: 'Novo', label: 'Novo' },
    { value: 'EmAnalise', label: 'Em análise' },
    { value: 'Visitado', label: 'Visitado' },
    { value: 'Proposta', label: 'Proposta' },
    { value: 'Descartado', label: 'Descartado' }
  ];

  readonly isSaving = input(false);
  readonly submitError = input('');
  readonly defaults = input<AppSettings | null>(null);
  readonly mode = input<'create' | 'edit'>('create');
  readonly initialValue = input<PropertyListing | null>(null);

  readonly cancel = output<void>();
  readonly save = output<CreatePropertyRequest>();

  readonly form = signal<CreatePropertyRequest>({
    title: '',
    category: '',
    source: 'AppExterno',
    originalUrl: '',
    swotStatus: 'Novo',
    price: null,
    condoFee: null,
    iptu: null,
    insurance: null,
    serviceFee: null,
    upfrontCost: null,
    addressLine: '',
    neighborhood: '',
    city: '',
    state: '',
    postalCode: '',
    latitude: null,
    longitude: null,
    hasExactLocation: true,
    notes: '',
    discardReason: '',
    isFavorite: false,
    excluded: false
  });

  readonly isCepLoading = signal(false);
  readonly cepError = signal('');

  readonly canSubmit = computed(() => {
    const value = this.form();

    return Boolean(
      value.title.trim()
      && value.category.trim()
      && value.addressLine.trim()
      && value.neighborhood.trim()
      && value.city.trim()
      && value.state.trim()
      && value.postalCode.trim()
    ) && (value.swotStatus !== 'Descartado' || Boolean(value.discardReason.trim()));
  });

  readonly modalEyebrow = computed(() => this.mode() === 'create' ? 'Cadastro rápido' : 'Edição completa');
  readonly modalTitle = computed(() => this.mode() === 'create' ? 'Novo imóvel' : 'Editar imóvel');
  readonly submitLabel = computed(() => this.mode() === 'create' ? 'Salvar registro' : 'Salvar alterações');

  constructor() {
    effect(() => {
      const defaults = this.defaults();
      if (!defaults || this.initialValue()) {
        return;
      }

      this.form.update(current => ({
        ...current,
        source: defaults.defaultSource,
        category: current.category || defaults.defaultCategory,
        city: current.city || defaults.defaultCity,
        state: current.state || defaults.defaultState,
        hasExactLocation: defaults.defaultHasExactLocation
      }));
    }, { allowSignalWrites: true });

    effect(() => {
      const initialValue = this.initialValue();
      if (!initialValue) {
        return;
      }

      this.form.set({
        title: initialValue.title,
        category: initialValue.category,
        source: initialValue.source,
        originalUrl: initialValue.originalUrl,
        swotStatus: initialValue.swotStatus,
        price: initialValue.price,
        condoFee: initialValue.condoFee,
        iptu: initialValue.iptu,
        insurance: initialValue.insurance,
        serviceFee: initialValue.serviceFee,
        upfrontCost: initialValue.upfrontCost,
        addressLine: initialValue.addressLine,
        neighborhood: initialValue.neighborhood,
        city: initialValue.city,
        state: initialValue.state,
        postalCode: initialValue.postalCode,
        latitude: initialValue.latitude,
        longitude: initialValue.longitude,
        hasExactLocation: initialValue.hasExactLocation,
        notes: initialValue.notes,
        discardReason: initialValue.discardReason,
        isFavorite: initialValue.isFavorite,
        excluded: initialValue.excluded
      });
      this.cepError.set('');
    }, { allowSignalWrites: true });
  }

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

  updateStatus(value: PropertySwotStatus): void {
    this.form.update(current => ({
      ...current,
      swotStatus: value,
      discardReason: value === 'Descartado' ? current.discardReason : ''
    }));
  }

  updateNumber(
    field: 'price' | 'condoFee' | 'iptu' | 'insurance' | 'serviceFee' | 'upfrontCost' | 'latitude' | 'longitude',
    value: string
  ): void {
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
          this.cepError.set('Não foi possível localizar o CEP informado.');
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
      notes: value.notes.trim(),
      discardReason: value.discardReason.trim(),
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
