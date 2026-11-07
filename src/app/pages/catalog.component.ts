import { Component, computed, inject, signal, DestroyRef } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EntryService } from '../core/entry.service';
import { creatureOfDay, matchesSearch, threatLabel } from '../core/models';
import { SpecimenComponent } from '../shared/specimen.component';
@Component({
  selector: 'app-home',
  imports: [RouterLink, SpecimenComponent],
  template: ` <div class="page-shell">
    <div class="section-kicker">
      <span>VOL. I — HISTORIA INNATURAL</span
      ><span>OBSERVACIÓN DEL DÍA · {{ date() }}</span>
    </div>
    <div class="intro-line">
      <p>Donde lo imposible deja huella.</p>
      <a class="text-link" routerLink="/wiki-articles"
        >Consultar el índice ↗</a
      >
    </div>
    @if (catalog.loading()) {
      <p class="notice" role="status">Abriendo el cuaderno…</p>
    } @else if (catalog.error()) {
      <p class="notice" role="alert">{{ catalog.error() }}</p>
    } @else if (selected(); as entry) {
      <app-specimen [entry]="entry" [daily]="true" />
      <section class="short-index">
        <h2>En otras páginas</h2>
        <ol>
          @for (item of others(); track item.id) {
            <li>
              <a [routerLink]="['/article', item.id]"
                ><span>{{ item.name || 'Sin nombre' }}</span
                ><small>{{ item.species || 'Sin clasificar' }}</small
                ><span aria-hidden="true">↗</span></a
              >
            </li>
          }
        </ol>
      </section>
    } @else {
      <section class="paper empty-state">
        <p class="eyebrow">EL ARCHIVO ESTÁ POR COMENZAR</p>
        <h1>Aún no hay criaturas documentadas.</h1>
        <p>Las primeras notas de campo tendrán su lugar aquí.</p>
        <a class="btn" routerLink="/entry">Escribir la primera ficha</a>
      </section>
    }
  </div>`,
})
export class HomeComponent {
  readonly catalog = inject(EntryService);
  private readonly day = signal(new Date().toISOString().slice(0, 10));
  readonly selected = computed(() =>
    creatureOfDay(this.catalog.entries(), new Date(this.day() + 'T12:00:00Z')),
  );
  readonly others = computed(() =>
    this.catalog
      .entries()
      .filter((e) => e.id !== this.selected()?.id)
      .slice(0, 4),
  );
  readonly date = computed(() =>
    new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(new Date(this.day() + 'T12:00:00Z')),
  );
  constructor() {
    const timer = setInterval(
      () => this.day.set(new Date().toISOString().slice(0, 10)),
      60000,
    );
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
@Component({
  selector: 'app-index',
  imports: [RouterLink, FormsModule],
  template: ` <div class="page-shell index-shell">
    <div class="section-kicker">
      <span>CATÁLOGO GENERAL</span
      ><span>{{ catalog.entries().length }} REGISTROS</span>
    </div>
    <header class="page-heading">
      <p class="eyebrow">ORDENAR LO EXTRAORDINARIO</p>
      <h1>Índice de criaturas</h1>
      <p>Busca un nombre, una especie o una huella en las notas del archivo.</p>
    </header>
    <form class="search-form" (ngSubmit)="search()">
      <label for="search">Buscar en el bestiario</label>
      <div class="input-row">
        <input
          id="search"
          name="q"
          [ngModel]="q()"
          (ngModelChange)="q.set($event)"
          placeholder="Nombre, especie, materia…"
          type="search"
        /><button class="btn" type="submit">Buscar</button>
      </div>
    </form>
    @if (catalog.loading()) {
      <p role="status">Consultando registros…</p>
    } @else if (catalog.error()) {
      <p class="notice" role="alert">{{ catalog.error() }}</p>
    } @else {
      <p class="results-count" role="status">
        {{ results().length }} fichas{{
          q() ? ' para «' + q() + '»' : ' en el archivo'
        }}
      </p>
      <ol class="catalog-list">
        @for (entry of results(); track entry.id; let number = $index) {
          <li>
            <a [routerLink]="['/article', entry.id]"
              ><span class="catalog-number">{{
                (number + 1).toString().padStart(2, '0')
              }}</span>
              <div>
                <h2>{{ entry.name || 'Sin nombre' }}</h2>
                <p>{{ entry.description || 'Notas pendientes.' }}</p>
                <small
                  >{{ entry.species || 'Sin clasificar' }} · Amenaza
                  {{ entry.threatLevel || 0 }}/10 —
                  {{ label(entry.threatLevel || 0) }}</small
                >
              </div>
              <span class="catalog-arrow" aria-hidden="true">↗</span></a
            >
          </li>
        } @empty {
          <li class="paper empty-state">
            <h2>No encontramos esa huella.</h2>
            <p>
              Prueba otra palabra o borra la búsqueda para volver al índice
              completo.
            </p>
            <button class="btn btn-secondary" (click)="clear()" type="button">
              Ver todo el archivo
            </button>
          </li>
        }
      </ol>
    }
  </div>`,
})
export class IndexComponent {
  readonly catalog = inject(EntryService);
  readonly q = signal('');
  readonly label = threatLabel;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly results = computed(() =>
    this.catalog
      .entries()
      .filter((e) => !this.q().trim() || matchesSearch(e, this.q())),
  );
  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => this.q.set(params.get('q') || ''));
  }
  search() {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.q().trim() || null },
      replaceUrl: true,
    });
  }
  clear() {
    this.q.set('');
    this.search();
  }
}
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template:
    '<div class="page-shell"><section class="paper empty-state"><p class="eyebrow">FOLIO EXTRAVIADO · 404</p><h1>Esta página no está en el archivo.</h1><p>El registro no existe o fue retirado del catálogo.</p><a class="btn" routerLink="/wiki-articles">Volver al índice</a></section></div>',
})
export class NotFoundComponent {}
