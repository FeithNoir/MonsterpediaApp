import { Injectable, inject } from '@angular/core';
import { IUser } from '../interfaces/auth.interface';
import { UserRole } from '../enums/user-role.enum';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  private authService = inject(AuthService);

  /**
   * Verifica si el usuario puede crear artículos
   * Permitido para: USER, ADMIN
   */
  canCreateArticle(user: IUser | null): boolean {
    if (!user || !user.isActive) return false;
    return user.role === UserRole.USER || user.role === UserRole.ADMIN;
  }

  /**
   * Verifica si el usuario puede editar un artículo
   * Permitido para: Propietario del artículo (USER) o ADMIN
   */
  canEditArticle(user: IUser | null, articleAuthorId: string): boolean {
    if (!user || !user.isActive) return false;
    
    // Admin puede editar cualquier artículo
    if (user.role === UserRole.ADMIN) return true;
    
    // Usuario solo puede editar sus propios artículos
    return user.role === UserRole.USER && user.id === articleAuthorId;
  }

  /**
   * Verifica si el usuario puede eliminar artículos
   * Permitido para: ADMIN
   */
  canDeleteArticle(user: IUser | null): boolean {
    if (!user || !user.isActive) return false;
    return user.role === UserRole.ADMIN;
  }

  /**
   * Verifica si el usuario puede aprobar/rechazar artículos
   * Permitido para: ADMIN
   */
  canApproveArticles(user: IUser | null): boolean {
    if (!user || !user.isActive) return false;
    return user.role === UserRole.ADMIN;
  }

  /**
   * Verifica si el usuario puede gestionar otros usuarios
   * Permitido para: ADMIN
   */
  canManageUsers(user: IUser | null): boolean {
    if (!user || !user.isActive) return false;
    return user.role === UserRole.ADMIN;
  }

  /**
   * Verifica si el usuario está activo
   */
  isActive(user: IUser | null): boolean {
    return user?.isActive ?? false;
  }

  /**
   * Verifica si el usuario es administrador
   */
  isAdmin(user: IUser | null): boolean {
    if (!user || !user.isActive) return false;
    return user.role === UserRole.ADMIN;
  }

  /**
   * Verifica si el usuario es un usuario normal (verificado)
   */
  isUser(user: IUser | null): boolean {
    if (!user || !user.isActive) return false;
    return user.role === UserRole.USER;
  }

  /**
   * Verifica si el usuario es visitante (sin verificar)
   */
  isVisitor(user: IUser | null): boolean {
    if (!user) return true;
    return user.role === UserRole.VISITOR;
  }

  /**
   * Obtiene el rol del usuario actual
   */
  getCurrentUserRole(): UserRole | null {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.role ?? null;
  }
}
