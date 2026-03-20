import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth';
import { NotificationService } from '../services/notification';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notifications = inject(NotificationService);
  const router = inject(Router);

  const token = authService.getToken();
  const isAuthEndpoint = req.url.includes('/api/auth/');

  const request = !token || isAuthEndpoint
    ? req
    : req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        authService.logout();
        notifications.warning('Session expired. Please login again.');
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    })
  );
};
