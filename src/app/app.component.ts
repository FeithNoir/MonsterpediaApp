import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <a class="skip" href="#main">Saltar al contenido</a>
    <header class="masthead">
      <div class="nav-shell">
        <a class="wordmark" routerLink="/home" (click)="open.set(false)"
          ><span aria-hidden="true">✧</span> Monsterpedia<small
            >ARCHIVO DE HISTORIA INNATURAL</small
          ></a
        >
        <button
          class="menu-toggle"
          type="button"
          aria-label="Abrir navegación"
          [attr.aria-expanded]="open()"
          aria-controls="navigation"
          (click)="open.set(!open())"
        >
          Menú ☰
        </button>
        <nav
          id="navigation"
          aria-label="Principal"
          [class.open]="open()"
          (click)="open.set(false)"
        >
          <a routerLink="/home" routerLinkActive="active">La ficha del día</a
          ><a routerLink="/wiki-articles" routerLinkActive="active">Índice</a>
          @if (auth.session(); as user) {
            @if (user.emailVerified) {
              <a routerLink="/entry" routerLinkActive="active">Nueva ficha</a
              ><a routerLink="/dashboard" routerLinkActive="active">Cuaderno</a>
            }
            <a routerLink="/profile" routerLinkActive="active">{{
              user.displayName
            }}</a>
          } @else {
            <a class="nav-enter" routerLink="/auth">Entrar</a>
          }
        </nav>
      </div>
    </header>
    <main id="main" tabindex="-1"><router-outlet /></main>
    <footer class="site-footer">
      <span>MONSTERPEDIA · CUADERNO DE CAMPO</span
      ><span>Observa. Documenta. Conserva el misterio.</span>
    </footer>
  `,
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly open = signal(false);
}
