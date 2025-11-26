import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IEntry } from '../../core/interfaces/entry.interface';
import { EntryService } from '../../core/services/entry.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-see-more-articles',
  imports: [CommonModule],
  templateUrl: './see-more-articles.component.html',
  styleUrl: './see-more-articles.component.css'
})
export class SeeMoreArticlesComponent implements OnInit, OnDestroy {
  private entryService = inject(EntryService);
  private router = inject(Router);
  private entriesSubscription: Subscription | undefined;

  protected articles = signal<IEntry[]>([]);
  protected isLoading = signal<boolean>(true);

  async ngOnInit(): Promise<void> {
    this.entriesSubscription = await this.entryService.getEntries().subscribe({
      next: (entries) => {
        if (entries.length > 0) {
          // Seleccionar 10 artículos aleatorios
          const shuffled = [...entries].sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, Math.min(10, entries.length));
          this.articles.set(selected);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar los artículos:', err);
        this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.entriesSubscription) {
      this.entriesSubscription.unsubscribe();
    }
  }

  protected viewArticle(id: string): void {
    this.router.navigate(['/entry', id]);
  }

  protected viewAllArticles(): void {
    this.router.navigate(['/wiki-articles']);
  }

  protected getThreatLevelClass(level: number): string {
    if (level >= 8) return 'threat-critical';
    if (level >= 5) return 'threat-high';
    if (level >= 3) return 'threat-medium';
    return 'threat-low';
  }
}
