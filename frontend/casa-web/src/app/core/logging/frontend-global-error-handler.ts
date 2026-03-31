import { ErrorHandler, Injectable, inject } from '@angular/core';

import { AppLogsService } from '../services/app-logs.service';

@Injectable()
export class FrontendGlobalErrorHandler implements ErrorHandler {
  private readonly appLogsService = inject(AppLogsService);

  handleError(error: unknown): void {
    const normalizedError = error instanceof Error ? error : new Error(String(error));

    this.appLogsService.logError(
      'Frontend',
      'UnhandledUiError',
      normalizedError.message || 'Erro nao tratado no frontend.',
      {
        stack: normalizedError.stack,
        url: window.location.href
      }
    );

    console.error(error);
  }
}
