import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService, authError } from '../core/auth.service';
import { EntryService } from '../core/entry.service';
import { PermissionsService } from '../core/permissions.service';
import { threatLabel } from '../core/models';
@Component({
  selector: 'app-profile',
  imports: [RouterLink, FormsModule],
  template: ` <div class="form-shell">
    <section class="paper form-paper">
      <p class="eyebrow">CARNÉ DE NATURALISTA</p>
      <h1>Tu lugar en el archivo</h1>
      @if (auth.session(); as user) {
        <h2>{{ user.displayName }}</h2>
        <p>
          Permiso:
          {{
            user.role === 'admin'
              ? 'Administración'
              : user.role === 'editor'
                ? 'Edición'
                : user.emailVerified
                  ? 'Naturalista'
                  : 'Lector'
          }}
        </p>
        @if (registered) {
          <p class="notice" role="status">
            Cuenta creada. Te enviamos un correo de verificación.
          </p>
        }
        @if (!user.emailVerified) {
          <p class="notice">
            Tu correo aún no está verificado. Puedes leer el archivo; verifica
            tu correo para publicar y editar tus fichas.
          </p>
          <button class="btn btn-secondary" type="button" (click)="verify()">
            Reenviar verificación
          </button>
        }
        <button class="btn btn-secondary" type="button" (click)="refresh()">
          Ya verifiqué mi correo
        </button>
        @if (user.emailVerified) {
          <a class="btn" routerLink="/dashboard">Abrir mi cuaderno</a>
        }
        <hr />
        <form #nameForm="ngForm" (ngSubmit)="saveName(nameForm)">
          <label for="public-name">Cambiar nombre público</label
          ><input
            id="public-name"
            name="displayName"
            [(ngModel)]="displayName"
            required
            maxlength="80"
            autocomplete="nickname"
            placeholder="Un nombre sin correo electrónico"
          /><button class="btn btn-secondary full" type="submit">
            Guardar nombre
          </button>
        </form>
        <button class="btn btn-secondary" type="button" (click)="logout()">
          Cerrar sesión
        </button>
      }
      @if (message()) {
        <p class="notice" role="status">{{ message() }}</p>
      }
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
    </section>
  </div>`,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private router = inject(Router);
  readonly message = signal('');
  readonly error = signal('');
  displayName = '';
  readonly registered =
    inject(ActivatedRoute).snapshot.queryParamMap.has('registered');
  constructor() {
    void this.refresh(false);
  }
  async refresh(feedback = true) {
    try {
      await this.auth.reloadUser();
      if (feedback)
        this.message.set(
          this.auth.session()?.emailVerified
            ? 'Correo verificado. Ya puedes escribir.'
            : 'Aún no aparece la verificación. Abre el enlace de tu correo e intenta de nuevo.',
        );
    } catch (err) {
      this.error.set(authError(err));
    }
  }
  async verify() {
    try {
      await this.auth.verify();
      this.message.set('Se envió el correo de verificación.');
    } catch (err) {
      this.error.set(authError(err));
    }
  }
  async saveName(form: NgForm) {
    if (form.invalid) return;
    if (!this.displayName.trim() || this.displayName.includes('@')) {
      this.error.set('Elige un nombre público sin correo electrónico.');
      return;
    }
    this.error.set('');
    try {
      await this.auth.updateDisplayName(this.displayName);
      form.resetForm();
      this.message.set(
        'Nombre público actualizado. Las fichas anteriores conservan su firma original.',
      );
    } catch (err) {
      this.error.set(authError(err));
    }
  }
  async logout() {
    try {
      await this.auth.logout();
      await this.router.navigate(['/home']);
    } catch (err) {
      this.error.set(authError(err));
    }
  }
}
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: ` <div class="page-shell">
    <header class="page-heading">
      <p class="eyebrow">CUADERNO DE TRABAJO</p>
      <h1>
        {{
          auth.session()?.role === 'admin'
            ? 'Administrar el archivo'
            : 'Mis notas de campo'
        }}
      </h1>
      <p>La autoría se conserva. Cada edición deja su propia huella.</p>
      <a class="btn" routerLink="/entry">Nueva ficha</a>
    </header>
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }
    @if (catalog.loading()) {
      <p role="status">Abriendo las notas…</p>
    } @else if (catalog.error()) {
      <p class="error" role="alert">{{ catalog.error() }}</p>
    } @else {
      <ul class="work-list">
        @for (entry of entries(); track entry.id) {
          <li class="paper">
            <div>
              <h2>
                <a [routerLink]="['/article', entry.id]">{{
                  entry.name || 'Sin nombre'
                }}</a>
              </h2>
              <p>
                Autoría: {{ entry.displayName || 'Archivo Monsterpedia' }} ·
                Amenaza {{ entry.threatLevel || 0 }}/10 ({{
                  label(entry.threatLevel || 0)
                }})
              </p>
            </div>
            <div class="actions">
              @if (permissions.canEditArticle(auth.session(), entry)) {
                <a class="btn btn-secondary" [routerLink]="['/entry', entry.id]"
                  >Editar</a
                >
              }
              @if (permissions.canDelete(auth.session())) {
                <button
                  class="btn btn-secondary"
                  type="button"
                  (click)="pendingDelete.set(entry.id)"
                >
                  Eliminar
                </button>
              }
              @if (pendingDelete() === entry.id) {
                <div class="delete-confirm" role="alert">
                  <p>
                    ¿Retirar «{{ entry.name }}» del catálogo? No se puede
                    deshacer.
                  </p>
                  <button
                    type="button"
                    class="btn"
                    (click)="remove(entry.id)"
                    [disabled]="busy()"
                  >
                    Confirmar eliminación</button
                  ><button
                    type="button"
                    class="btn btn-secondary"
                    (click)="pendingDelete.set('')"
                  >
                    Cancelar
                  </button>
                </div>
              }
            </div>
          </li>
        } @empty {
          <li class="paper empty-state">
            <h2>Tu cuaderno está en blanco.</h2>
            <p>Documenta la primera criatura para comenzar.</p>
          </li>
        }
      </ul>
    }
  </div>`,
})
export class DashboardComponent {
  readonly auth = inject(AuthService);
  readonly catalog = inject(EntryService);
  readonly permissions = inject(PermissionsService);
  readonly label = threatLabel;
  readonly entries = computed(() =>
    this.catalog
      .entries()
      .filter(
        (e) =>
          this.auth.session()?.role === 'admin' ||
          e.authorId === this.auth.session()?.uid,
      ),
  );
  readonly error = signal('');
  readonly pendingDelete = signal('');
  readonly busy = signal(false);
  async remove(id: string) {
    if (!this.permissions.canDelete(this.auth.session())) return;
    this.busy.set(true);
    try {
      await this.catalog.delete(id);
      this.pendingDelete.set('');
    } catch {
      this.error.set(
        'No se pudo retirar la ficha. Revisa tus permisos e intenta de nuevo.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
