import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const retryHeader = 'x-refresh-retry';

  // Skip auth header for auth endpoints
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const token = authService.getAccessToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.headers.has(retryHeader)) {
        // Try to refresh the token
        return authService.refreshToken().pipe(
          switchMap((response) => {
            if (!response.accessToken) {
              authService.signOut();
              router.navigate(['/login']);
              return throwError(() => new Error('Missing access token'));
            }
            // Retry the original request with the new token
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.accessToken}`,
                [retryHeader]: '1',
              },
            });
            return next(newReq);
          }),
          catchError((refreshError) => {
            // Refresh failed, redirect to login
            authService.signOut();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }

      if (error.status === 401) {
        authService.signOut();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
