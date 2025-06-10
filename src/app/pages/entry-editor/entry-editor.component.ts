import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { v4 as uuidv4 } from 'uuid';
import { IEntry } from '../../core/interfaces/entry.interface';
import { EntryService } from '../../core/services/entry.service';
import { IMonsterGirl } from '../../core/interfaces/monster-girl.interface';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IUser } from '../../core/interfaces/auth.interface';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-entry-editor',
  imports: [CommonModule, ReactiveFormsModule, MarkdownModule,  InputTextModule, TextareaModule, InputNumberModule, SelectModule, FileUploadModule, ButtonModule,
  ],
  templateUrl: './entry-editor.component.html',
  styleUrl: './entry-editor.component.css'
})
export class EntryEditorComponent {
  private fb = inject(FormBuilder);
  private entryService = inject(EntryService);
  private router = inject(Router);
  private authService = inject(AuthService);

  protected initialEntry = input<IEntry | null>(null);
  protected currentUser: IUser = this.authService.getCurrentUser()!;

  entryForm = this.fb.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
    author: this.currentUser,
    tags: [''],
    monsterGirl: this.fb.group({
      name: [''],
      description: [''],
      commonNames: this.fb.control<string[]>([]),
      species: [''],
      clasification: this.fb.control<string[]>([]),
      alignment: ['Neutral'],
      threatLevel: [1],
      longevity: [''],
      image: [''],
      stats: this.fb.group({
        strength: [1],
        agility: [1],
        intelligence: [1],
        charm: [1],
        magic: [1],
      }),
    }),
  });

  ngOnInit(): void {}

  protected onSubmit(): void {
  if (this.entryForm.invalid) return;

  const form = this.entryForm.value;
  const mosterGirl: IMonsterGirl = {
    id: this.initialEntry()?.MonsterGirl?.id ?? uuidv4(),
    name: form.monsterGirl?.name ?? '',
    description: form.monsterGirl?.description ?? '',
    commonNames: form.monsterGirl?.commonNames ?? [],
    species: form.monsterGirl?.species ?? '',
    clasification: form.monsterGirl?.clasification ?? [],
    alignment: form.monsterGirl?.alignment ?? '',
    threatLevel: form.monsterGirl?.threatLevel ?? 0,
    longevity: form.monsterGirl?.longevity ?? '',
    stats: {
      strength: form.monsterGirl?.stats?.strength ?? 0,
      agility: form.monsterGirl?.stats?.agility ?? 0,
      intelligence: form.monsterGirl?.stats?.intelligence ?? 0,
      charm: form.monsterGirl?.stats?.charm ?? 0,
      magic: form.monsterGirl?.stats?.magic ?? 0
    }
  };
  const entry: IEntry = {
    id: this.initialEntry()?.id ?? uuidv4(),
    title: form.title!,
    content: form.content!,
    author: form.author!,
    date: this.initialEntry()?.date ?? new Date(),
    tags: form.tags ? form.tags.split(',').map(tag => tag.trim()) : [],
    MonsterGirl: mosterGirl
  };

  console.log(entry);
  // if (this.initialEntry() != null) {
  //   this.entryService.updateEntry(entry).then(console.log);
  // } else {
  //   this.entryService.createEntry(entry).then(console.log);
  // }
  }

  protected goToUrl(url: string): void {
      this.router.navigateByUrl(url);
  }
}
