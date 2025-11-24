import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EntryService } from '../../core/services/entry.service';
import { IEntry } from '../../core/interfaces/entry.interface';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private entryService = inject(EntryService);
  private router = inject(Router);

  protected entries = signal<IEntry[]>([]);
  protected loading = signal(true);

  ngOnInit(): void {
    this.loadEntries();
  }

  private loadEntries(): void {
    this.entryService.getEntries().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading entries:', err);
        this.loading.set(false);
      }
    });
  }

  protected createNewEntry(): void {
    this.router.navigateByUrl('/entry');
  }

  protected editEntry(id: string): void {
    this.router.navigateByUrl(`/entry/${id}`);
  }

  protected goToProfile(): void {
    this.router.navigateByUrl('/profile');
  }

  protected deleteEntry(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta entrada?')) {
      this.entryService.deleteEntry(id).then(() => {
        console.log('Entry deleted successfully');
        // Entries will automatically update via the observable
      }).catch(err => {
        console.error('Error deleting entry:', err);
      });
    }
  }

  protected formatDate(date: any): string {
    if (!date) return 'N/A';

    // Handle Firestore Timestamp
    if (date.toDate) {
      return date.toDate().toLocaleDateString('es-ES');
    }

    // Handle Date object
    if (date instanceof Date) {
      return date.toLocaleDateString('es-ES');
    }

    // Handle string
    return new Date(date).toLocaleDateString('es-ES');
  }
}
