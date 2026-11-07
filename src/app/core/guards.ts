import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from './auth.service';
export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  return inject(AuthService).currentUser$.pipe(
    take(1),
    map((user) =>
      user
        ? true
        : router.createUrlTree(['/auth'], {
            queryParams: { returnUrl: state.url },
          }),
    ),
  );
};
export const roleGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthService).currentUser$.pipe(
    take(1),
    map((user) =>
      user?.emailVerified
        ? true
        : router.createUrlTree(['/profile'], { queryParams: { verify: '1' } }),
    ),
  );
};
export interface UnsavedForm {
  hasUnsavedChanges(): boolean;
}
export const unsavedGuard: CanDeactivateFn<UnsavedForm> = (component) =>
  !component.hasUnsavedChanges() ||
  window.confirm('Hay cambios sin guardar. ¿Salir de esta ficha?');
