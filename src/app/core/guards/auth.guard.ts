import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    map(user => {
      if (!user) {
        router.navigate(['/login']);
        return false;
      }

      if (!user.emailVerified) {
        router.navigate(['/verify-email']);
        return false;
      }

      return true;
    })
  );
};
