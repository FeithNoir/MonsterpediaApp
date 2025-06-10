import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { v4 as uuidv4 } from 'uuid';
import { IEntry } from '../../core/interfaces/entry.interface';
import { EntryService } from '../../core/services/entry.service';
import { IMonsterGirl } from '../../core/interfaces/monster-girl.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-entry-editor',
  imports: [CommonModule, ReactiveFormsModule, MarkdownModule],
  templateUrl: './entry-editor.component.html',
  styleUrl: './entry-editor.component.css'
})
export class EntryEditorComponent {
private fb = inject(FormBuilder);
  private entryService = inject(EntryService);
  private router = inject(Router);


  protected initialEntry = input<IEntry | null>(null);

  entryForm = this.fb.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
    author: ['', Validators.required],
    tags: [''],
  });

  ngOnInit(): void {
    if (this.initialEntry() != null) {
      this.entryForm.patchValue({
        title: this.initialEntry()!.title,
        content: this.initialEntry()!.content,
        author: this.initialEntry()!.author,
        tags: this.initialEntry()!.tags.join(', '),
      });
    }
  }

  protected onSubmit(): void {
    if (this.entryForm.invalid) return;

    const form = this.entryForm.value;

    const entry: IEntry = {
      id: this.initialEntry()?.id ?? uuidv4(),
      title: form.title!,
      content: form.content!,
      author: form.author!,
      date: this.initialEntry()?.date ?? new Date(),
      tags: form.tags ? form.tags.split(',').map(tag => tag.trim()) : [],
      MonsterGirl: this.initialEntry()?.MonsterGirl ?? this.createDummyMonsterGirl(), // Se reemplaza si ya existe
    };

    if (this.initialEntry() != null) {
      this.entryService.updateEntry(entry).then(console.log);
    } else {
      this.entryService.createEntry(entry).then(console.log);
    }
  }

  private createDummyMonsterGirl(): IMonsterGirl {
    return {
      id: uuidv4(),
      name: 'Sin Nombre',
      description: 'Descripción genérica.',
      commonNames: [],
      species: 'Desconocida',
      clasification: ['Críptida'],
      alignment: 'Neutral',
      threatLevel: 1,
      longevity: 'Desconocida',
      stats: {
        strength: 1,
        agility: 1,
        intelligence: 1,
        charm: 1,
        magic: 1,
      },
    };
  }

  protected goToUrl(url: string): void {
    this.router.navigateByUrl(url);
  }
}
