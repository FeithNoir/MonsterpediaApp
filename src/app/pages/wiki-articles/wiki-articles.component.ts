import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IEntry } from '../../core/interfaces/entry.interface';
import { EntryService } from '../../core/services/entry.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'pages-wiki-articles',
  imports: [CommonModule],
  templateUrl: './wiki-articles.component.html',
  styleUrl: './wiki-articles.component.css'
})
export class WikiArticlesComponent implements OnInit, OnDestroy {
  private entryService = inject(EntryService);
  private router = inject(Router);
  private entriesSubscription: Subscription | undefined;

  protected entries = signal<IEntry[]>([]);
  protected filteredEntries = signal<IEntry[]>([]);
  protected searchTerm = signal<string>('');
  protected isLoading = signal<boolean>(true);

  async ngOnInit(): Promise<void> {
    this.entriesSubscription = await this.entryService.getEntries().subscribe({
      next: (resp) => {
        this.entries.set(resp);
        this.filteredEntries.set(resp);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar las entradas:', err);
        this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.entriesSubscription) {
      this.entriesSubscription.unsubscribe();
    }
  }

  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    const term = input.value.toLowerCase();
    this.searchTerm.set(term);

    if (term === '') {
      this.filteredEntries.set(this.entries());
    } else {
      const filtered = this.entries().filter(entry =>
        entry.name.toLowerCase().includes(term) ||
        entry.description.toLowerCase().includes(term) ||
        entry.species.toLowerCase().includes(term) ||
        entry.tags.some(tag => tag.toLowerCase().includes(term))
      );
      this.filteredEntries.set(filtered);
    }
  }

  protected viewEntry(id: string): void {
    this.router.navigate(['/entry', id]);
  }

  protected getThreatLevelClass(level: number): string {
    if (level >= 8) return 'threat-critical';
    if (level >= 5) return 'threat-high';
    if (level >= 3) return 'threat-medium';
    return 'threat-low';
  }
}
