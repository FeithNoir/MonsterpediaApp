import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './core/guards/auth.guard';

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
        canActivate: [authGuard]
      },
      {
        path: 'entry',
        title: 'Entrada',
        loadComponent: () => import('./pages/entry/entry.component').then((c) => c.EntryComponent),
        canActivate: [authGuard]
      },
      {
        path: 'entry/:id',
        title: 'Editar Entrada',
        loadComponent: () => import('./pages/entry/entry.component').then((c) => c.EntryComponent),
        canActivate: [authGuard]
      },
      {
        path: 'profile',
        title: 'Perfil',
        loadComponent: () => import('./pages/profile/profile.component').then((c) => c.ProfileComponent),
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
