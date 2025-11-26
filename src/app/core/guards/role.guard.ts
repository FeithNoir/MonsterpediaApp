import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../enums/user-role.enum';

/**
 * Guard para proteger rutas basado en roles de usuario
 * Uso: canActivate: [roleGuard([UserRole.USER, UserRole.ADMIN])]
 */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
      map(user => {
        // Si no hay usuario, redirigir a auth
        if (!user) {
          router.navigate(['/auth']);
          return false;
        }

        // Si el usuario no está activo, redirigir a home
        if (!user.isActive) {
          router.navigate(['/home']);
          return false;
        }

        // Verificar si el rol del usuario está en los roles permitidos
        if (allowedRoles.includes(user.role)) {
          return true;
        }

        // Si no tiene permisos, redirigir a home
        router.navigate(['/home']);
        return false;
      })
    );
  };
};
