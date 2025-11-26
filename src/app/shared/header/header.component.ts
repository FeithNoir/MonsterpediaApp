import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'shared-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  private router = inject(Router);
  public isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  navigateToAuth() {
    this.router.navigate(['/auth']);
    this.isMenuOpen = false;
  }

  navigateToWiki() {
    this.router.navigate(['/wiki-articles']);
    this.isMenuOpen = false;
  }

  navigateToHome() {
    this.router.navigate(['/home']);
    this.isMenuOpen = false;
  }
}