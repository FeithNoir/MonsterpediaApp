import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return from(authService.getCurrentUserToken()).pipe(
    switchMap((token) => {
      if (req.url.includes('/auth')) {
        return next(req);
      }

      if (req.url.includes('/main')) {
        return next(req);
      }

      if (req.url.includes('/reset-password')) {
        return next(req);
      }

      if (token) {
        const cloned = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
        return next(cloned);
      }
      return next(req);
    })
  );
};
