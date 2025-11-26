import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/enums/user-role.enum';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/layout/layout.component').then((c) => c.LayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        title: 'Home',
        component: HomeComponent,
      },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then((c) => c.DashboardComponent),
        canActivate: [authGuard, roleGuard([UserRole.USER, UserRole.ADMIN])]
      },
      {
        path: 'entry',
        title: 'Entrada',
        loadComponent: () => import('./pages/entry/entry.component').then((c) => c.EntryComponent),
        canActivate: [authGuard, roleGuard([UserRole.USER, UserRole.ADMIN])]
      },
      {
        path: 'entry/:id',
        title: 'Editar Entrada',
        loadComponent: () => import('./pages/entry/entry.component').then((c) => c.EntryComponent),
        canActivate: [authGuard, roleGuard([UserRole.USER, UserRole.ADMIN])]
      },
      {
        path: 'profile',
        title: 'Perfil',
        loadComponent: () => import('./pages/profile/profile.component').then((c) => c.ProfileComponent),
        canActivate: [authGuard]
      },
      {
        path: 'wiki-articles',
        title: 'Wiki de Monstruos',
        loadComponent: () => import('./pages/wiki-articles/wiki-articles.component').then((c) => c.WikiArticlesComponent),
        canActivate: [authGuard]
      },
    ],
  },
  {
    path: 'auth',
    title: 'Auth',
    loadComponent: () => import('./auth/auth/auth.component').then((c) => c.AuthComponent),
  },
  {
    path: 'reset-password',
    title: 'Reset Password',
    loadComponent: () => import('./auth/reset-password/reset-password.component').then((c) => c.ResetPasswordComponent),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
