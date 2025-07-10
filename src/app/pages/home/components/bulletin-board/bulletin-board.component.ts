import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { IEntry } from '../../../../core/interfaces/entry.interface';
import { EntryService } from '../../../../core/services/entry.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'pages-bulletin-board',
  imports: [],
  templateUrl: './bulletin-board.component.html',
  styleUrl: './bulletin-board.component.css'
})
export class BulletinBoardComponent implements OnInit, OnDestroy {
  protected imgUrl: string = './lamia.jpg';
  private entryService = inject(EntryService);
  private entriesSubscription: Subscription | undefined;

  protected mosterGirlData = signal<IEntry | null>(null);

  async ngOnInit(): Promise<void> {
    this.entriesSubscription = await this.entryService.getEntries().subscribe(resp => {
      const randomIndex = Math.floor(Math.random() * resp.length);
      this.mosterGirlData.set(resp[randomIndex]);
    });
  }

  ngOnDestroy(): void {
    if (this.entriesSubscription) {
      this.entriesSubscription.unsubscribe();
    }
  }
}
