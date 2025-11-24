import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ILoginCredentials, IRegisterCredentials } from '../../core/interfaces/auth.interface';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

@Component({
  selector: 'auth-login',
  imports: [CommonModule, FormsModule, InputGroupModule, InputGroupAddonModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    // If user is already authenticated, redirect to dashboard
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.router.navigateByUrl('/dashboard');
      }
    });
  }


  // Mode signal: 'login' o 'register'
  protected mode = signal<'login' | 'register'>('login');

  // Form signals
  protected email = signal('');
  protected password = signal('');
  protected displayName = signal('');
  protected passwordType = signal('password');

  // Feedback
  protected feedbackMessage = signal<string | null>(null);
  protected feedbackError = signal<string | null>(null);
  protected loading = signal(false);

  protected toggleMode() {
    this.mode.update((m) => (m === 'login' ? 'register' : 'login'));
    this.clearFeedback();
  }

  protected clearFeedback() {
    this.feedbackMessage.set(null);
    this.feedbackError.set(null);
  }

  protected submit() {
    this.clearFeedback();
    this.loading.set(true);

    if (this.mode() === 'login') {
      const credentials: ILoginCredentials = { email: this.email(), password: this.password() };

      this.authService.login(credentials).subscribe({
        next: (res) => {
          this.feedbackMessage.set(res.message);
          // Auto-navigate after a short delay to show success message
          setTimeout(() => {
            this.router.navigateByUrl('/dashboard');
          }, 1000);
        },
        error: (err) => {
          let errorMessage = 'Ocurrió un error inesperado. Inténtalo de nuevo más tarde.';

          if (err.code) {
            switch (err.code) {
              case 'auth/invalid-credential':
                errorMessage = 'Credenciales inválidas. Verifica tu correo y contraseña.';
                break;
              case 'auth/user-not-found':
                errorMessage = 'No existe una cuenta con este correo electrónico.';
                break;
              case 'auth/wrong-password':
                errorMessage = 'Contraseña incorrecta.';
                break;
              case 'auth/too-many-requests':
                errorMessage = 'Demasiados intentos fallidos. Inténtalo de nuevo más tarde.';
                break;
            }
          }
          this.feedbackError.set(errorMessage);
          this.loading.set(false);
        }
      });
    } else {
      const userData: IRegisterCredentials = {
        email: this.email(),
        password: this.password(),
        displayName: this.displayName() || undefined
      };

      this.authService.register(userData).subscribe({
        next: (res) => {
          this.feedbackMessage.set(res.message);
          this.toggleMode();
          this.loading.set(false);
        },
        error: (err) => {
          let errorMessage = 'Error al registrar usuario.';
          if (err.code === 'auth/email-already-in-use') {
            errorMessage = 'El correo electrónico ya está en uso.';
          } else if (err.code === 'auth/weak-password') {
            errorMessage = 'La contraseña es demasiado débil.';
          }
          this.feedbackError.set(errorMessage);
          this.loading.set(false);
        }
      });
    }
  }

  protected toggleIcon() {
    if (this.passwordType() === 'password') {
      this.passwordType.set('text');
    } else {
      this.passwordType.set('password');
    }
  }

  protected goToUrl(url: string): void {
    this.router.navigateByUrl(url);
  }
}
