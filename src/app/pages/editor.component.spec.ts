import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import {
  provideRouter,
  ActivatedRoute,
  convertToParamMap,
  Router,
} from '@angular/router';
import { of } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { EditorComponent } from './editor.component';
import { EntryService } from '../core/entry.service';
import { AuthService } from '../core/auth.service';
import { Entry } from '../core/models';
const original = {
  id: 'old',
  name: 'Basilisco',
  description: 'Una criatura',
  species: 'Reptil',
  alignment: 'Neutral',
  longevity: '100 años',
  content: 'Notas del archivo',
  commonNames: [],
  clasification: [],
  tags: [],
  images: [],
  threatLevel: 8,
  authorId: 'alice',
  displayName: 'Alicia',
  createdAt: Timestamp.fromMillis(1),
  updatedAt: Timestamp.fromMillis(2),
  version: 1,
} as Entry;
describe('entry form', () => {
  let catalog: {
    entries: ReturnType<typeof signal<Entry[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string>>;
    newId: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    upload: ReturnType<typeof vi.fn>;
  };
  beforeEach(() => {
    catalog = {
      entries: signal<Entry[]>([]),
      loading: signal(false),
      error: signal(''),
      newId: vi.fn(() => 'new'),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      upload: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [EditorComponent],
      providers: [
        provideRouter([]),
        { provide: EntryService, useValue: catalog },
        {
          provide: AuthService,
          useValue: {
            session: signal({
              uid: 'alice',
              role: 'user',
              emailVerified: true,
            }),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({})) },
        },
      ],
    });
  });
  it('marks required fields and never submits an empty form', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.componentInstance.save();
    f.detectChanges();
    expect(catalog.create).not.toHaveBeenCalled();
    expect(f.nativeElement.textContent).toContain('Escribe el nombre');
  });
  it('keeps authorId and createdAt out of update payloads', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { paramMap: of(convertToParamMap({ id: 'old' })) },
    });
    catalog.entries.set([original]);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    f.componentInstance.form.controls.name.setValue('Basilisco revisado');
    await f.componentInstance.save();
    expect(catalog.update).toHaveBeenCalledOnce();
    const [savedOriginal, payload] = catalog.update.mock.calls[0];
    expect(savedOriginal.authorId).toBe('alice');
    expect(savedOriginal.createdAt).toBe(original.createdAt);
    expect(payload).not.toHaveProperty('authorId');
    expect(payload).not.toHaveProperty('createdAt');
    expect(payload.name).toBe('Basilisco revisado');
  });
  it('rejects whitespace and out-of-range threats', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    f.componentInstance.form.patchValue({ name: ' ', threatLevel: 11 });
    await f.componentInstance.save();
    expect(catalog.create).not.toHaveBeenCalled();
    expect(f.componentInstance.form.invalid).toBe(true);
  });
  it('shows a conflict and keeps the local draft', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { paramMap: of(convertToParamMap({ id: 'old' })) },
    });
    catalog.entries.set([original]);
    catalog.update.mockRejectedValue(new Error('CONFLICT'));
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    f.componentInstance.form.controls.name.setValue('Mi borrador');
    await f.componentInstance.save();
    expect(f.componentInstance.conflict()).toBe(true);
    expect(f.componentInstance.form.controls.name.value).toBe('Mi borrador');
  });
});
