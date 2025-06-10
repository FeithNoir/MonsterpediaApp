import { Component, computed, effect, inject, signal,
} from '@angular/core';
import { EntryService } from '../../core/services/entry.service';
import { Router } from '@angular/router';
import { IEntry } from '../../core/interfaces/entry.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private entryService = inject(EntryService);
  private router = inject(Router);

  protected entries = signal<IEntry[]>([]);
  protected search = signal<string>('');
  protected filteredEntries = computed(() =>
    this.entries().filter(
      (entry) =>
        entry.title.toLowerCase().includes(this.search().toLowerCase()) ||
        entry.tags.some((tag) =>
          tag.toLowerCase().includes(this.search().toLowerCase())
        )
    )
  );

  constructor() {
    effect(() => {
      this.entryService
        .getEntries()
        .subscribe((entries) => this.entries.set(entries));
    });
  }

  protected deleteEntry(id: string) {
    if (confirm('¿Estás seguro de que quieres eliminar esta entrada?')) {
      this.entryService.deleteEntry(id);
    }
  }

  protected editEntry(id: string) {
    this.router.navigate(['/entry'], { queryParams: { id } });
  }

  protected newEntry() {
    this.router.navigate(['/entry']);
  }
}
