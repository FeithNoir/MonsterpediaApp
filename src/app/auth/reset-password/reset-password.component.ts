import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { IAuthResponse } from '../../core/interfaces/auth.interface';

@Component({
  selector: 'auth-reset-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
private authService = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  loading = signal(false);

  onSubmit() {
    this.loading.set(true);
    this.message.set(null);
    this.error.set(null);

    this.authService.forgotPassword(this.email()).subscribe({
      next: (res: IAuthResponse) => {
        this.message.set(res.message);
        this.loading.set(false);
      },
      error: (err: IAuthResponse) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
