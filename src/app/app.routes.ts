import { Routes } from '@angular/router';
import { authGuard, roleGuard, unsavedGuard } from './core/guards';
export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    title: 'Monsterpedia · Cuaderno de campo',
    loadComponent: () =>
      import('./pages/catalog.component').then((m) => m.HomeComponent),
  },
  {
    path: 'wiki-articles',
    title: 'Monsterpedia · Índice',
    loadComponent: () =>
      import('./pages/catalog.component').then((m) => m.IndexComponent),
  },
  {
    path: 'article/:id',
    title: 'Monsterpedia · Ficha',
    loadComponent: () =>
      import('./pages/article.component').then((m) => m.ArticleComponent),
  },
  {
    path: 'auth',
    title: 'Monsterpedia · Entrar',
    loadComponent: () =>
      import('./pages/auth.component').then((m) => m.AuthComponent),
  },
  {
    path: 'reset-password',
    title: 'Monsterpedia · Recuperar acceso',
    loadComponent: () =>
      import('./pages/auth.component').then((m) => m.ResetComponent),
  },
  {
    path: 'profile',
    title: 'Monsterpedia · Perfil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/account.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'dashboard',
    title: 'Monsterpedia · Cuaderno',
    canActivate: [authGuard, roleGuard],
    loadComponent: () =>
      import('./pages/account.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'entry',
    title: 'Monsterpedia · Nueva ficha',
    canActivate: [authGuard, roleGuard],
    canDeactivate: [unsavedGuard],
    loadComponent: () =>
      import('./pages/editor.component').then((m) => m.EditorComponent),
  },
  {
    path: 'entry/:id',
    title: 'Monsterpedia · Editar ficha',
    canActivate: [authGuard, roleGuard],
    canDeactivate: [unsavedGuard],
    loadComponent: () =>
      import('./pages/editor.component').then((m) => m.EditorComponent),
  },
  {
    path: '**',
    title: 'Monsterpedia · No encontrado',
    loadComponent: () =>
      import('./pages/catalog.component').then((m) => m.NotFoundComponent),
  },
];
