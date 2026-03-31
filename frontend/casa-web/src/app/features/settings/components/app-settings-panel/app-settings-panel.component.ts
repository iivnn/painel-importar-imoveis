import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppLogLevel } from '../../../logs/models/app-log.model';
import { PropertySource, PropertySwotStatus } from '../../../properties/models/create-property.model';
import {
  AppSettings,
  DEFAULT_APP_SETTINGS
} from '../../models/app-settings.model';

type NumericField =
  | 'listingsPageSize'
  | 'favoritesPageSize'
  | 'mapInitialLatitude'
  | 'mapInitialLongitude'
  | 'mapInitialZoom'
  | 'monthlyBudgetIdeal'
  | 'monthlyBudgetMax'
  | 'priceBelowAverageRatio'
  | 'priceAboveAverageRatio'
  | 'minimumPhotoCount'
  | 'priceWeight'
  | 'locationWeight'
  | 'analysisWeight'
  | 'evidenceWeight'
  | 'sourceQualityWeight'
  | 'infoLogRetentionDays'
  | 'warningLogRetentionDays'
  | 'errorLogRetentionDays'
  | 'logDetailsMaxLength';

type BooleanField =
  | 'defaultHasExactLocation'
  | 'mapOnlyExactLocation'
  | 'requireCoordinatesForCompleteLocation'
  | 'requireOriginalUrl'
  | 'logNavigationEvents'
  | 'logFrontendHttpFailures'
  | 'logRealtimeEvents'
  | 'logExtensionExtractionEvents'
  | 'logExtensionGeocodingEvents'
  | 'logExtensionImageImportEvents'
  | 'allowFrontendLogIngestion'
  | 'allowExtensionLogIngestion'
  | 'logAutoCleanupEnabled';

type TextField = 'defaultCategory' | 'defaultCity' | 'defaultState';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app-settings-panel.component.html',
  styleUrl: './app-settings-panel.component.css'
})
export class AppSettingsPanelComponent {
  readonly settings = input<AppSettings | null>(null);
  readonly isLoading = input(false);
  readonly isSaving = input(false);
  readonly loadError = input('');
  readonly saveError = input('');
  readonly saveSuccessMessage = input('');
  readonly isClearingLogs = input(false);

  readonly save = output<AppSettings>();
  readonly clearLogs = output<void>();

  readonly sourceOptions: { value: PropertySource; label: string }[] = [
    { value: 'AppExterno', label: 'App externo' },
    { value: 'PortalWeb', label: 'Portal web' },
    { value: 'Indicacao', label: 'Indicacao' },
    { value: 'Corretor', label: 'Corretor' },
    { value: 'Outro', label: 'Outro' }
  ];

  readonly favoriteSortOptions = [
    { value: 'Recent', label: 'Mais recentes' },
    { value: 'LowestPrice', label: 'Menor preco' },
    { value: 'HighestScore', label: 'Maior nota' },
    { value: 'Status', label: 'Status' }
  ] as const;

  readonly statusOptions: { value: PropertySwotStatus; label: string }[] = [
    { value: 'Novo', label: 'Novo' },
    { value: 'EmAnalise', label: 'Em analise' },
    { value: 'Visitado', label: 'Visitado' },
    { value: 'Proposta', label: 'Proposta' },
    { value: 'Descartado', label: 'Descartado' }
  ];

  readonly logLevelOptions: { value: AppLogLevel; label: string }[] = [
    { value: 'Info', label: 'Info' },
    { value: 'Warning', label: 'Warning' },
    { value: 'Error', label: 'Error' }
  ];

  readonly form = signal<AppSettings>(DEFAULT_APP_SETTINGS);
  readonly preferredNeighborhoodsText = signal('');
  readonly avoidedNeighborhoodsText = signal('');
  readonly totalWeight = computed(() => {
    const value = this.form();
    return value.priceWeight
      + value.locationWeight
      + value.analysisWeight
      + value.evidenceWeight
      + value.sourceQualityWeight;
  });

  constructor() {
    effect(() => {
      const settings = this.settings();
      if (!settings) {
        return;
      }

      this.form.set({
        ...settings,
        preferredNeighborhoods: [...settings.preferredNeighborhoods],
        avoidedNeighborhoods: [...settings.avoidedNeighborhoods],
        requireSwotStatuses: [...settings.requireSwotStatuses],
        requireNotesStatuses: [...settings.requireNotesStatuses],
        requireMediaStatuses: [...settings.requireMediaStatuses]
      });
      this.preferredNeighborhoodsText.set(settings.preferredNeighborhoods.join('\n'));
      this.avoidedNeighborhoodsText.set(settings.avoidedNeighborhoods.join('\n'));
    }, { allowSignalWrites: true });
  }

  updateText(field: TextField, value: string): void {
    this.form.update(current => ({
      ...current,
      [field]: value
    }));
  }

  updateNumber(field: NumericField, value: string): void {
    const parsed = Number(value);
    this.form.update(current => ({
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : 0
    }));
  }

  updateBoolean(field: BooleanField, value: boolean): void {
    this.form.update(current => ({
      ...current,
      [field]: value
    }));
  }

  updateSource(value: PropertySource): void {
    this.form.update(current => ({
      ...current,
      defaultSource: value
    }));
  }

  updateFavoriteSort(value: AppSettings['favoritesSortBy']): void {
    this.form.update(current => ({
      ...current,
      favoritesSortBy: value
    }));
  }

  updateLogLevel(
    field: 'backendMinimumLogLevel' | 'frontendMinimumLogLevel' | 'extensionMinimumLogLevel',
    value: AppLogLevel
  ): void {
    this.form.update(current => ({
      ...current,
      [field]: value
    }));
  }

  updateNeighborhoods(kind: 'preferred' | 'avoided', value: string): void {
    const items = value
      .split(/\r?\n/)
      .map(item => item.trim())
      .filter(Boolean);

    if (kind === 'preferred') {
      this.preferredNeighborhoodsText.set(value);
      this.form.update(current => ({
        ...current,
        preferredNeighborhoods: items
      }));
      return;
    }

    this.avoidedNeighborhoodsText.set(value);
    this.form.update(current => ({
      ...current,
      avoidedNeighborhoods: items
    }));
  }

  toggleStatus(
    field: 'requireSwotStatuses' | 'requireNotesStatuses' | 'requireMediaStatuses',
    status: PropertySwotStatus,
    checked: boolean
  ): void {
    this.form.update(current => {
      const existing = new Set(current[field]);
      if (checked) {
        existing.add(status);
      } else {
        existing.delete(status);
      }

      return {
        ...current,
        [field]: Array.from(existing)
      };
    });
  }

  hasStatus(field: 'requireSwotStatuses' | 'requireNotesStatuses' | 'requireMediaStatuses', status: PropertySwotStatus): boolean {
    return this.form()[field].includes(status);
  }

  submit(): void {
    if (this.isLoading() || this.isSaving()) {
      return;
    }

    const value = this.form();
    this.save.emit({
      ...value,
      defaultCategory: value.defaultCategory.trim(),
      defaultCity: value.defaultCity.trim(),
      defaultState: value.defaultState.trim().toUpperCase(),
      preferredNeighborhoods: value.preferredNeighborhoods.map(item => item.trim()).filter(Boolean),
      avoidedNeighborhoods: value.avoidedNeighborhoods.map(item => item.trim()).filter(Boolean)
    });
  }

  requestClearLogs(): void {
    if (this.isLoading() || this.isSaving() || this.isClearingLogs()) {
      return;
    }

    this.clearLogs.emit();
  }
}
