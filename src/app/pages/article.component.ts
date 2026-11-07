import {
  Component,
  computed,
  effect,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title, Meta } from '@angular/platform-browser';
import { EntryService } from '../core/entry.service';
import { AuthService } from '../core/auth.service';
import { PermissionsService } from '../core/permissions.service';
import { Revision } from '../core/models';
import { SpecimenComponent } from '../shared/specimen.component';
import { MarkdownComponent } from '../shared/markdown.component';
import { NotFoundComponent } from './catalog.component';
@Component({
  selector: 'app-article',
  imports: [
    RouterLink,
    DatePipe,
    SpecimenComponent,
    MarkdownComponent,
    NotFoundComponent,
  ],
  template: `
    @if (catalog.loading()) {
      <p class="page-shell" role="status">Buscando el folio…</p>
    } @else if (catalog.error()) {
      <p class="page-shell notice" role="alert">{{ catalog.error() }}</p>
    } @else if (entry(); as item) {
      <div class="page-shell">
        <div class="article-tools">
          <a class="text-link" routerLink="/wiki-articles"
            >← Índice de criaturas</a
          >
          @if (permissions.canEditArticle(auth.session(), item)) {
            <a class="btn btn-secondary" [routerLink]="['/entry', item.id]"
              >Editar ficha</a
            >
          }
        </div>
        <app-specimen [entry]="item" />
        @if (item.images.length && item.images.length > 1) {
          <section class="image-gallery" aria-label="Láminas adicionales">
            @for (image of item.images.slice(1); track image; let i = $index) {
              <figure>
                <img
                  [src]="image"
                  [alt]="item.name + ', lámina ' + (i + 2)"
                  loading="lazy"
                />
              </figure>
            }
          </section>
        }
        <section class="history paper">
          <p class="eyebrow">MEMORIA DEL ARCHIVO</p>
          <h2>Últimas revisiones</h2>
          <p>
            Versión actual: {{ item.version || 1 }}. Se conservan las notas
            anteriores de cada edición.
          </p>
          @if (revisionError()) {
            <p role="status">No se pudo consultar el historial.</p>
          }
          @for (revision of revisions(); track revision.id) {
            <details>
              <summary>
                Versión {{ revision.snapshot.version }} ·
                {{
                  revision.createdAt.toDate()
                    | date: 'd MMM yyyy, HH:mm' : '-0500'
                }}
                (Bogotá)
              </summary>
              <h3>{{ revision.snapshot.name }}</h3>
              <p>{{ revision.snapshot.description }}</p>
              <app-markdown [content]="revision.snapshot.content" />
            </details>
          } @empty {
            <p class="muted">
              Esta ficha todavía no tiene versiones anteriores.
            </p>
          }
        </section>
      </div>
    } @else {
      <app-not-found />
    }
  `,
})
export class ArticleComponent {
  readonly catalog = inject(EntryService);
  readonly auth = inject(AuthService);
  readonly permissions = inject(PermissionsService);
  private params = toSignal(inject(ActivatedRoute).paramMap);
  readonly entry = computed(() =>
    this.catalog.entries().find((e) => e.id === this.params()?.get('id')),
  );
  readonly revisions = signal<Revision[]>([]);
  readonly revisionError = signal(false);
  constructor() {
    const title = inject(Title);
    const meta = inject(Meta);
    effect((onCleanup) => {
      const id = this.params()?.get('id');
      this.revisions.set([]);
      this.revisionError.set(false);
      if (id)
        onCleanup(
          this.catalog.watchRevisions(
            id,
            (items) => this.revisions.set(items),
            () => this.revisionError.set(true),
          ),
        );
    });
    effect(() => {
      const e = this.entry();
      if (e) {
        title.setTitle(`Monsterpedia · ${e.name}`);
        meta.updateTag({
          name: 'description',
          content: (e.description || '').slice(0, 160),
        });
      }
    });
    inject(DestroyRef).onDestroy(() =>
      meta.updateTag({
        name: 'description',
        content:
          'Un cuaderno de historia innatural: criaturas, láminas y notas de campo para explorar un bestiario colectivo.',
      }),
    );
  }
}
