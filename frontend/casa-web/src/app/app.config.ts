import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { apiErrorLoggingInterceptor } from './core/logging/api-error-logging.interceptor';
import { FrontendGlobalErrorHandler } from './core/logging/frontend-global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([apiErrorLoggingInterceptor])),
    provideRouter(routes),
    { provide: ErrorHandler, useClass: FrontendGlobalErrorHandler }
  ]
};
