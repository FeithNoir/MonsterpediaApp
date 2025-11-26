import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IEntry } from '../../core/interfaces/entry.interface';
import { EntryService } from '../../core/services/entry.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-article-of-the-day',
  imports: [CommonModule],
  templateUrl: './article-of-the-day.component.html',
  styleUrl: './article-of-the-day.component.css'
})
export class ArticleOfTheDayComponent implements OnInit, OnDestroy {
  private entryService = inject(EntryService);
  private router = inject(Router);
  private entriesSubscription: Subscription | undefined;

  protected article = signal<IEntry | null>(null);
  protected isLoading = signal<boolean>(true);

  async ngOnInit(): Promise<void> {
    this.entriesSubscription = await this.entryService.getEntries().subscribe({
      next: (entries) => {
        if (entries.length > 0) {
          // Seleccionar un artículo aleatorio
          const randomIndex = Math.floor(Math.random() * entries.length);
          this.article.set(entries[randomIndex]);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el artículo del día:', err);
        this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.entriesSubscription) {
      this.entriesSubscription.unsubscribe();
    }
  }

  protected viewArticle(): void {
    const article = this.article();
    if (article) {
      this.router.navigate(['/entry', article.id]);
    }
  }

  protected getThreatLevelClass(level: number): string {
    if (level >= 8) return 'threat-critical';
    if (level >= 5) return 'threat-high';
    if (level >= 3) return 'threat-medium';
    return 'threat-low';
  }

  protected getThreatLevelText(level: number): string {
    if (level >= 8) return 'Crítico';
    if (level >= 5) return 'Alto';
    if (level >= 3) return 'Medio';
    return 'Bajo';
  }
}
