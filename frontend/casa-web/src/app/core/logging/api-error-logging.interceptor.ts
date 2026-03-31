import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';

import {
  AppLogsService,
  isLogEndpoint,
  normalizeLogLevelFromStatus,
  readLogTraceId
} from '../services/app-logs.service';

export const apiErrorLoggingInterceptor: HttpInterceptorFn = (request, next) => {
  const appLogsService = inject(AppLogsService);

  return next(request).pipe(
    tap({
      error: error => {
        if (!(error instanceof HttpErrorResponse) || isLogEndpoint(request.url)) {
          return;
        }

        appLogsService.logSilently({
          source: 'Frontend',
          level: normalizeLogLevelFromStatus(error.status),
          category: 'Http',
          eventName: 'ApiRequestFailed',
          message: `Requisicao HTTP falhou: ${request.method} ${request.url}`,
          details: {
            requestUrl: request.url,
            requestMethod: request.method,
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            response: error.error
          },
          traceId: readLogTraceId(error.error),
          path: request.url,
          method: request.method
        });
      }
    })
  );
};
