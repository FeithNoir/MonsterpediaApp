import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IUser } from '../../core/interfaces/auth.interface';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  protected profileForm!: FormGroup;
  protected currentUser = signal<IUser | null>(null);
  protected loading = signal(false);
  protected feedbackMessage = signal<string | null>(null);
  protected feedbackError = signal<string | null>(null);

  ngOnInit(): void {
    // Initialize form first
    this.profileForm = this.fb.group({
      displayName: ['', Validators.required],
      photoURL: ['']
    });

    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      if (user) {
        this.profileForm.patchValue({
          displayName: user.displayName || '',
          photoURL: user.photoURL || ''
        });
      }
    });
  }

  protected updateProfile(): void {
    if (this.profileForm.valid) {
      this.loading.set(true);
      this.clearFeedback();

      const formData = this.profileForm.value;

      this.authService.updateUserProfile({
        displayName: formData.displayName,
        photoURL: formData.photoURL || undefined
      }).subscribe({
        next: (response) => {
          this.feedbackMessage.set(response.message);
          this.loading.set(false);
        },
        error: (err) => {
          this.feedbackError.set(err.message || 'Error al actualizar el perfil');
          this.loading.set(false);
        }
      });
    }
  }

  protected sendVerificationEmail(): void {
    this.loading.set(true);
    this.clearFeedback();

    this.authService.sendVerificationEmail().subscribe({
      next: (response) => {
        this.feedbackMessage.set(response.message);
        this.loading.set(false);
      },
      error: (err) => {
        this.feedbackError.set(err.message || 'Error al enviar el email de verificación');
        this.loading.set(false);
      }
    });
  }

  protected goToDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }

  private clearFeedback(): void {
    this.feedbackMessage.set(null);
    this.feedbackError.set(null);
  }
}
