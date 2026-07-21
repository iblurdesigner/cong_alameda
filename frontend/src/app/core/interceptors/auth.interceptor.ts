import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  const token = authService.getToken();
  console.log('[Interceptor] Request to:', req.url, '| Token present:', !!token, '| Token:', token ? token.substring(0, 15) + '...' : 'null');
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // NO hacer logout automáticamente - solo rechazar el request
        // El usuario puede re-autenticarse si es necesario
        console.warn('[Interceptor] 401 received but NOT logging out:', req.url);
      }
      return throwError(() => error);
    })
  );
};
