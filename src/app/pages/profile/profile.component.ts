import { Component, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IUser } from '../../core/interfaces/auth.interface';

@Component({
  selector: 'pages-profile',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
private authService = inject(AuthService);

  user = signal<IUser | null>(null);
  displayName = signal<string>('');
  photoURL = signal<string>('');
  message = signal<string | null>(null);

  constructor() {
    effect(() => {
      const current = this.authService.getCurrentUser();
      if (current) {
        this.user.set(current);
        this.displayName.set(current.displayName || '');
        this.photoURL.set(current.photoURL || '');
      }
    });
  }

  saveProfile() {
    const current = this.authService.getCurrentUser();
    if (!current) return;

    // updateProfile(current as any, {
    //   displayName: this.displayName(),
    //   photoURL: this.photoURL(),
    // })
    //   .then(() => {
    //     this.authService.reloadUser().subscribe(() => {
    //       this.message.set('Perfil actualizado exitosamente');
    //     });
    //   })
    //   .catch((err) => {
    //     this.message.set('Error al actualizar perfil: ' + err.message);
    //   });
  }
}
