import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule, provideMarkdown } from 'ngx-markdown';
import { IEntry } from '../../../../core/interfaces/entry.interface';
import { EntryService } from '../../../../core/services/entry.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'pages-monster-article',
  imports: [CommonModule, MarkdownModule],
  providers: [provideMarkdown()],
  templateUrl: './monster-article.component.html',
  styleUrl: './monster-article.component.css',
})
export class MonsterArticleComponent implements OnInit, OnDestroy {
  private entryService = inject(EntryService);
  private entriesSubscription: Subscription | undefined;

  protected entry = signal<IEntry | null>(null);

  async ngOnInit(): Promise<void> {
    this.entriesSubscription = await this.entryService.getEntries().subscribe(resp => {
      const randomIndex = Math.floor(Math.random() * resp.length);
      this.entry.set(resp[randomIndex]);
    });
  }

  ngOnDestroy(): void {
    if (this.entriesSubscription) {
      this.entriesSubscription.unsubscribe();
    }
  }
}
