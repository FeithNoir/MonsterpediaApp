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
  imports: [CommonModule, FormsModule, InputGroupModule, InputGroupAddonModule ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  private authService = inject(AuthService);
  private router = inject(Router);


  // Mode signal: 'login' o 'register'
  protected mode = signal<'login' | 'register'>('login');

  // Form signals
  protected email = signal('');
  protected password = signal('');
  protected displayName = signal('');
  protected isViewingPassword: boolean = false;

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
          this.router.navigateByUrl('dashboard');
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

  protected toggleIcon():void {
    this.isViewingPassword = !this.isViewingPassword;
  }

  protected goToUrl(url: string):void {
    if(url != null && url.length > 0) {
      this.router.navigateByUrl(url);
    }
  }
}
