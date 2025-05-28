import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ILoginCredentials, IRegisterCredentials } from '../../core/interfaces/auth.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'auth-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
private authService = inject(AuthService);

  // Mode signal: 'login' o 'register'
  mode = signal<'login' | 'register'>('login');

  // Form signals
  email = signal('');
  password = signal('');
  displayName = signal('');

  // Feedback
  feedbackMessage = signal<string | null>(null);
  feedbackError = signal<string | null>(null);
  loading = signal(false);

  toggleMode() {
    this.mode.update((m) => (m === 'login' ? 'register' : 'login'));
    this.clearFeedback();
  }

  clearFeedback() {
    this.feedbackMessage.set(null);
    this.feedbackError.set(null);
  }

  submit() {
    this.clearFeedback();
    this.loading.set(true);

    if (this.mode() === 'login') {
      const credentials: ILoginCredentials = {
        email: this.email(),
        password: this.password(),
      };

      this.authService.login(credentials).subscribe({
        next: (res) => {
          this.feedbackMessage.set(res.message);
          this.loading.set(false);
        },
        error: (err) => {
          this.feedbackError.set(err.message);
          this.loading.set(false);
        },
      });
    } else {
      const credentials: IRegisterCredentials = {
        email: this.email(),
        password: this.password(),
        displayName: this.displayName(),
      };

      this.authService.register(credentials).subscribe({
        next: (res) => {
          this.feedbackMessage.set(res.message);
          this.loading.set(false);
        },
        error: (err) => {
          this.feedbackError.set(err.message);
          this.loading.set(false);
        },
      });
    }
  }
}
