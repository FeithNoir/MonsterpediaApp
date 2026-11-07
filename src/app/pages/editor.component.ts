import {
  Component,
  computed,
  effect,
  inject,
  signal,
  HostListener,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { EntryService } from '../core/entry.service';
import { AuthService } from '../core/auth.service';
import { PermissionsService } from '../core/permissions.service';
import { Entry, EntryContent } from '../core/models';
import { NotFoundComponent } from './catalog.component';
const list = (value: string): string[] =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
@Component({
  selector: 'app-editor',
  imports: [ReactiveFormsModule, RouterLink, NotFoundComponent],
  template: `
    @if (catalog.loading()) {
      <p class="page-shell" role="status">Preparando las notas…</p>
    } @else if (catalog.error()) {
      <p class="page-shell error" role="alert">{{ catalog.error() }}</p>
    } @else if (missing()) {
      <app-not-found />
    } @else if (denied()) {
      <div class="page-shell">
        <section class="paper empty-state">
          <h1>Esta ficha tiene otra autoría.</h1>
          <p>Solo su autor o una persona administradora puede editarla.</p>
          <a class="btn" [routerLink]="['/article', id()]">Leer la ficha</a>
        </section>
      </div>
    } @else {
      <div class="page-shell editor-shell">
        <header class="page-heading">
          <p class="eyebrow">MESA DE DOCUMENTACIÓN</p>
          <h1>{{ original ? 'Revisar una ficha' : 'Nueva nota de campo' }}</h1>
          <p>
            Escribe una criatura por ficha. No incluyas correos ni datos
            personales en las notas públicas.
          </p>
        </header>
        <form [formGroup]="form" (ngSubmit)="save()" class="paper editor-paper">
          <div class="editor-fields">
            <div class="field full-field">
              <label for="entry-name">Nombre de la criatura *</label
              ><input id="entry-name" formControlName="name" maxlength="120" />
              @if (invalid('name')) {
                <p class="field-error">
                  Escribe el nombre (máximo 120 caracteres).
                </p>
              }
            </div>
            <div class="field full-field">
              <label for="entry-description">Nota de presentación *</label
              ><textarea
                id="entry-description"
                formControlName="description"
                rows="3"
                maxlength="1000"
              ></textarea>
              @if (invalid('description')) {
                <p class="field-error">
                  Añade una presentación (máximo 1000 caracteres).
                </p>
              }
            </div>
            <div class="field">
              <label for="species">Especie *</label
              ><input id="species" formControlName="species" maxlength="120" />
              @if (invalid('species')) {
                <p class="field-error">Indica una especie.</p>
              }
            </div>
            <div class="field">
              <label for="common">Nombres comunes</label
              ><input id="common" formControlName="commonNames" /><small
                >Hasta 5, separados por comas.</small
              >
            </div>
            <div class="field">
              <label for="classification">Clasificación</label
              ><input id="classification" formControlName="clasification" />
            </div>
            <div class="field">
              <label for="alignment">Alineamiento *</label
              ><input
                id="alignment"
                formControlName="alignment"
                maxlength="120"
              />
              @if (invalid('alignment')) {
                <p class="field-error">Indica el alineamiento.</p>
              }
            </div>
            <div class="field">
              <label for="longevity">Longevidad *</label
              ><input
                id="longevity"
                formControlName="longevity"
                maxlength="120"
              />
              @if (invalid('longevity')) {
                <p class="field-error">
                  Indica la longevidad, o «Desconocida».
                </p>
              }
            </div>
            <div class="field">
              <label for="threat">Amenaza (0–10) *</label
              ><input
                id="threat"
                type="number"
                min="0"
                max="10"
                step="1"
                formControlName="threatLevel"
              />
              @if (invalid('threatLevel')) {
                <p class="field-error">Usa un entero de 0 a 10.</p>
              }
            </div>
            <div class="field full-field">
              <label for="content">Notas del espécimen (Markdown) *</label
              ><textarea
                id="content"
                rows="14"
                formControlName="content"
                maxlength="50000"
                placeholder="## Hábitat y observaciones"
              ></textarea>
              @if (invalid('content')) {
                <p class="field-error">
                  Escribe las notas de la ficha (máximo 50 000 caracteres).
                </p>
              }
            </div>
            <div class="field full-field">
              <label for="tags">Materias</label
              ><input id="tags" formControlName="tags" /><small
                >Hasta 5 por lista, separadas por comas; máximo 80 caracteres
                cada una.</small
              >
            </div>
          </div>
          <section class="upload-section">
            <h2>Láminas del espécimen</h2>
            <p>
              Hasta cuatro imágenes JPG, PNG, WebP o GIF. Máximo 5 MB cada una.
            </p>
            <label for="images">Adjuntar una lámina</label
            ><input
              id="images"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              (change)="upload($event)"
              [disabled]="uploading() || images().length >= 4"
            />
            @if (uploading()) {
              <p role="status">Guardando la lámina en el archivo…</p>
            }
            <div class="upload-previews">
              @for (url of images(); track url; let index = $index) {
                <figure>
                  <img [src]="url" [alt]="'Vista previa ' + (index + 1)" />
                  <figcaption>
                    <button
                      class="btn btn-secondary"
                      type="button"
                      (click)="removeImage(index)"
                    >
                      Quitar lámina {{ index + 1 }}
                    </button>
                  </figcaption>
                </figure>
              }
            </div>
          </section>
          @if (error()) {
            <div class="error" role="alert">
              {{ error() }}
              @if (conflict()) {
                <p>
                  Tu borrador sigue aquí. Copia tus notas antes de recargar.
                </p>
                <details>
                  <summary>Leer la versión actual del archivo</summary>
                  <h2>{{ current()?.name }}</h2>
                  <p>{{ current()?.description }}</p>
                  <pre class="conflict-preview">{{ current()?.content }}</pre>
                </details>
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="reloadLatest()"
                >
                  Cargar la versión del archivo
                </button>
              }
            </div>
          }
          <div class="editor-actions">
            <button
              class="btn"
              type="submit"
              [disabled]="saving() || uploading()"
            >
              {{
                saving()
                  ? 'Guardando…'
                  : original
                    ? 'Guardar revisión'
                    : 'Publicar ficha'
              }}</button
            ><button
              class="btn btn-secondary"
              type="button"
              (click)="resetForm()"
            >
              Restablecer formulario</button
            ><a class="text-link" routerLink="/dashboard">Volver al cuaderno</a>
          </div>
        </form>
      </div>
    }
  `,
})
export class EditorComponent {
  readonly catalog = inject(EntryService);
  private auth = inject(AuthService);
  private permissions = inject(PermissionsService);
  private router = inject(Router);
  private params = toSignal(inject(ActivatedRoute).paramMap);
  private fb = inject(FormBuilder);
  private newId = this.catalog.newId();
  readonly id = computed(() => this.params()?.get('id') || this.newId);
  readonly current = computed(() =>
    this.catalog.entries().find((e) => e.id === this.id()),
  );
  readonly missing = computed(
    () => !!this.params()?.get('id') && !this.current(),
  );
  readonly denied = computed(
    () =>
      !!this.current() &&
      !this.permissions.canEditArticle(this.auth.session(), this.current()!),
  );
  original: Entry | null = null;
  private loadedId = '';
  private imageDirty = false;
  readonly images = signal<string[]>([]);
  readonly error = signal('');
  readonly conflict = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    species: ['', [Validators.required, Validators.maxLength(120)]],
    alignment: [
      'Desconocido',
      [Validators.required, Validators.maxLength(120)],
    ],
    longevity: [
      'Desconocida',
      [Validators.required, Validators.maxLength(120)],
    ],
    content: ['', [Validators.required, Validators.maxLength(50000)]],
    commonNames: [''],
    clasification: [''],
    tags: [''],
    threatLevel: [
      0,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(10),
        Validators.pattern(/^\d+$/),
      ],
    ],
  });
  constructor() {
    effect(() => {
      const entry = this.current();
      if (entry && this.loadedId !== entry.id && !this.denied()) {
        this.original = entry;
        this.loadedId = entry.id;
        this.fill(entry);
      }
    });
  }
  private fill(e: Entry | null) {
    this.form.reset({
      name: e?.name || '',
      description: e?.description || '',
      species: e?.species || '',
      alignment: e?.alignment || 'Desconocido',
      longevity: e?.longevity || 'Desconocida',
      content: e?.content || '',
      commonNames: e?.commonNames?.join(', ') || '',
      clasification: e?.clasification?.join(', ') || '',
      tags: e?.tags?.join(', ') || '',
      threatLevel: e?.threatLevel || 0,
    });
    this.images.set([...(e?.images || [])]);
    this.imageDirty = false;
  }
  invalid(name: string) {
    const c = this.form.get(name);
    return !!c?.invalid && (c.touched || c.dirty);
  }
  hasUnsavedChanges() {
    return this.form.dirty || this.imageDirty || this.uploading();
  }
  @HostListener('window:beforeunload', ['$event']) unload(
    event: BeforeUnloadEvent,
  ) {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }
  resetForm() {
    if (
      !this.hasUnsavedChanges() ||
      window.confirm('¿Descartar los cambios del formulario?')
    ) {
      this.fill(this.original);
      this.error.set('');
      this.conflict.set(false);
    }
  }
  reloadLatest() {
    const e = this.current();
    if (
      e &&
      window.confirm(
        '¿Reemplazar tu borrador por la versión actual del archivo?',
      )
    ) {
      this.original = e;
      this.fill(e);
      this.error.set('');
      this.conflict.set(false);
    }
  }
  removeImage(index: number) {
    this.images.update((images) => images.filter((_, i) => i !== index));
    this.imageDirty = true;
  }
  async upload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.images().length >= 4) return;
    this.uploading.set(true);
    this.error.set('');
    try {
      const url = await this.catalog.upload(file, this.id());
      this.images.update((images) => [...images, url]);
      this.imageDirty = true;
    } catch (err) {
      this.error.set(
        err instanceof Error && !err.message.startsWith('Firebase')
          ? err.message
          : 'No se pudo subir la lámina. Revisa tu conexión y tus permisos.',
      );
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }
  async save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving() || this.uploading() || this.denied())
      return;
    const v = this.form.getRawValue();
    const content: EntryContent = {
      name: v.name.trim(),
      description: v.description.trim(),
      species: v.species.trim(),
      alignment: v.alignment.trim(),
      longevity: v.longevity.trim(),
      content: v.content.trim(),
      commonNames: list(v.commonNames),
      clasification: list(v.clasification),
      tags: list(v.tags),
      images: this.images(),
      threatLevel: Number(v.threatLevel),
    };
    if (
      [
        'name',
        'description',
        'species',
        'alignment',
        'longevity',
        'content',
      ].some((key) => !(content[key as keyof EntryContent] as string).length)
    ) {
      this.error.set(
        'Los campos obligatorios no pueden contener solo espacios.',
      );
      return;
    }
    if (
      [content.commonNames, content.clasification, content.tags].some(
        (items) => items.length > 5 || items.some((s) => s.length > 80),
      )
    ) {
      this.error.set(
        'Cada lista admite hasta 5 elementos de máximo 80 caracteres.',
      );
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.conflict.set(false);
    try {
      if (this.original) await this.catalog.update(this.original, content);
      else await this.catalog.create(this.id(), content);
      this.form.markAsPristine();
      this.imageDirty = false;
      await this.router.navigate(['/article', this.id()]);
    } catch (err) {
      if (err instanceof Error && err.message === 'CONFLICT') {
        this.conflict.set(true);
        this.error.set(
          'Otra persona actualizó esta ficha. No sobrescribimos su versión.',
        );
      } else
        this.error.set(
          'No se pudo guardar la ficha. Revisa tus permisos, la conexión y los campos.',
        );
    } finally {
      this.saving.set(false);
    }
  }
}
