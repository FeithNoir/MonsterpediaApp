import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, authError } from '../core/auth.service';
import { safeReturnUrl } from '../core/models';
@Component({
  selector: 'app-auth',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="form-shell">
      <section class="paper form-paper">
        <p class="eyebrow">ACCESO AL ARCHIVO</p>
        <h1>
          {{ registerMode() ? 'Unirse al cuaderno' : 'Volver a las notas' }}
        </h1>
        <p>
          {{
            registerMode()
              ? 'Crea tu cuenta para documentar criaturas. Verifica tu correo antes de publicar.'
              : 'La lectura es libre. Entra para escribir y conservar tus notas.'
          }}
        </p>
        <form #form="ngForm" (ngSubmit)="submit(form)">
          @if (registerMode()) {
            <label for="name">Nombre público (sin correo)</label
            ><input
              id="name"
              name="displayName"
              [(ngModel)]="displayName"
              required
              maxlength="80"
              autocomplete="nickname"
            />
          }
          <label for="email">Correo electrónico</label
          ><input
            id="email"
            name="email"
            [(ngModel)]="email"
            type="email"
            required
            email
            autocomplete="email"
          />
          <label for="password">Contraseña</label>
          <div class="input-row">
            <input
              id="password"
              name="password"
              [(ngModel)]="password"
              [type]="showPassword() ? 'text' : 'password'"
              required
              [minlength]="registerMode() ? 8 : 6"
              [autocomplete]="
                registerMode() ? 'new-password' : 'current-password'
              "
            /><button
              type="button"
              class="btn btn-secondary"
              [attr.aria-pressed]="showPassword()"
              (click)="showPassword.set(!showPassword())"
            >
              {{ showPassword() ? 'Ocultar' : 'Mostrar' }}
            </button>
          </div>
          @if (form.submitted && form.invalid) {
            <p class="error" role="alert">
              Completa un correo válido y una contraseña de al menos
              {{ registerMode() ? 8 : 6 }} caracteres.
            </p>
          }
          @if (error()) {
            <p class="error" role="alert">{{ error() }}</p>
          }
          @if (message()) {
            <p class="notice" role="status">{{ message() }}</p>
          }
          <button class="btn full" type="submit" [disabled]="busy()">
            {{
              busy()
                ? 'Un momento…'
                : registerMode()
                  ? 'Crear cuenta'
                  : 'Entrar al cuaderno'
            }}
          </button>
        </form>
        <a routerLink="/reset-password">Olvidé mi contraseña</a>
        <hr />
        <button
          type="button"
          class="text-link"
          (click)="registerMode.set(!registerMode()); error.set('')"
        >
          {{ registerMode() ? 'Ya tengo una cuenta' : 'Crear una cuenta' }}
        </button>
      </section>
    </div>
  `,
})
export class AuthComponent {
  readonly auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly registerMode = signal(false);
  readonly showPassword = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  email = '';
  password = '';
  displayName = '';
  async submit(form: NgForm) {
    if (
      this.busy() ||
      form.invalid ||
      !this.email.includes('@') ||
      this.password.length < (this.registerMode() ? 8 : 6)
    )
      return;
    if (
      this.registerMode() &&
      (!this.displayName.trim() || this.displayName.includes('@'))
    ) {
      this.error.set('Elige un nombre público sin correo electrónico.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      if (this.registerMode()) {
        await this.auth.register(
          this.email.trim(),
          this.password,
          this.displayName.trim(),
        );
        await this.router.navigate(['/profile'], {
          queryParams: { registered: '1' },
        });
      } else {
        await this.auth.login(this.email.trim(), this.password);
        await this.router.navigateByUrl(
          safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')),
        );
      }
      this.password = '';
    } catch (err) {
      this.error.set(authError(err));
    } finally {
      this.busy.set(false);
    }
  }
}
@Component({
  selector: 'app-reset',
  imports: [FormsModule, RouterLink],
  template: ` <div class="form-shell">
    <section class="paper form-paper">
      <p class="eyebrow">RECUPERAR EL ACCESO</p>
      <h1>Retomar el cuaderno</h1>
      <p>
        Si existe una cuenta para este correo, recibirás un enlace para
        restablecer tu contraseña.
      </p>
      <form #form="ngForm" (ngSubmit)="submit(form)">
        <label for="reset-email">Correo electrónico</label
        ><input
          id="reset-email"
          type="email"
          email
          required
          name="email"
          [(ngModel)]="email"
          autocomplete="email"
        />
        @if (form.submitted && form.invalid) {
          <p class="error" role="alert">Escribe un correo válido.</p>
        }
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        @if (message()) {
          <p class="notice" role="status">{{ message() }}</p>
        }
        <button type="submit" class="btn full" [disabled]="busy()">
          {{ busy() ? 'Enviando…' : 'Solicitar enlace' }}
        </button>
      </form>
      <a routerLink="/auth">← Volver a entrar</a>
    </section>
  </div>`,
})
export class ResetComponent {
  private auth = inject(AuthService);
  email = '';
  readonly error = signal('');
  readonly message = signal('');
  readonly busy = signal(false);
  async submit(form: NgForm) {
    if (this.busy() || form.invalid || !this.email.includes('@')) return;
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    try {
      await this.auth.reset(this.email.trim());
      form.resetForm();
      this.email = '';
      this.message.set(
        'Si existe una cuenta con ese correo, recibirás un enlace para recuperar tu acceso.',
      );
    } catch (err) {
      this.error.set(authError(err));
    } finally {
      this.busy.set(false);
    }
  }
}
