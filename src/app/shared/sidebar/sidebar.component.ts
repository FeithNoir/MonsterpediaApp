import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected isAuthenticated = signal(false);
  protected currentUser = signal<any>(null);

  constructor() {
    // Subscribe to authentication state
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated.set(isAuth);
    });

    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigateByUrl('/auth');
      },
      error: (err) => {
        console.error('Error al cerrar sesión:', err);
        this.router.navigateByUrl('/auth');
      }
    });
  }
}
