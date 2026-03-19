import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';

export const httpLoggingInterceptor: HttpInterceptorFn = (req, next) => {
  const startedAt = performance.now();

  return next(req).pipe(
    tap((event) => {
      if (event.type === 4) {
        const durationMs = Math.round(performance.now() - startedAt);
        console.info('[HTTP]', req.method, req.urlWithParams, 'status=', event.status, 'durationMs=', durationMs);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      const durationMs = Math.round(performance.now() - startedAt);
      const requestId = error.headers?.get('X-Request-Id');

      console.error('[HTTP]', req.method, req.urlWithParams, {
        status: error.status,
        durationMs,
        message: error.message,
        requestId,
        responseBody: error.error,
      });

      return throwError(() => error);
    })
  );
};
