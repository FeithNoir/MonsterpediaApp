import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Entry, threatLabel } from '../core/models';
import { MarkdownComponent } from './markdown.component';
@Component({
  selector: 'app-specimen',
  imports: [RouterLink, MarkdownComponent],
  template: `
    <article class="folio">
      <div class="folio-heading">
        <span
          >ARCHIVO DE CAMPO / {{ entry().id.slice(0, 6).toUpperCase() }}</span
        ><span>FICHA {{ entry().version || 1 }} · MONSTERPEDIA</span>
      </div>
      <div class="spread">
        <aside class="specimen-side" aria-label="Lámina y taxonomía">
          <figure class="plate">
            @if (entry().images[0]; as image) {
              <img
                [src]="image"
                [alt]="'Lámina de ' + entry().name"
                (error)="imageFailed = true"
                [hidden]="imageFailed"
              />
            }
            @if (!entry().images[0] || imageFailed) {
              <div
                class="empty-plate"
                role="img"
                [attr.aria-label]="'Lámina pendiente de ' + entry().name"
              >
                <span class="plate-cross" aria-hidden="true">✳</span
                ><span>LÁMINA PENDIENTE</span
                ><small
                  >ESPÉCIMEN {{ entry().id.slice(0, 6).toUpperCase() }}</small
                >
              </div>
            }
            <figcaption>
              Fig. {{ entry().id.slice(0, 4).toUpperCase() }} —
              {{ entry().name || 'Sin nombre' }}
            </figcaption>
          </figure>
          <dl class="taxonomy">
            <div>
              <dt>Especie</dt>
              <dd>{{ entry().species || 'Sin clasificar' }}</dd>
            </div>
            <div>
              <dt>Clasificación</dt>
              <dd>{{ entry().clasification.join(', ') || 'Por estudiar' }}</dd>
            </div>
            <div>
              <dt>Alineamiento</dt>
              <dd>{{ entry().alignment || 'Desconocido' }}</dd>
            </div>
            <div>
              <dt>Longevidad</dt>
              <dd>{{ entry().longevity || 'Desconocida' }}</dd>
            </div>
          </dl>
          <div class="threat">
            <span class="eyebrow">ESCALA DE AMENAZA</span
            ><strong
              >{{ label(entry().threatLevel || 0) }} ·
              {{ entry().threatLevel || 0 }} / 10</strong
            ><span class="threat-marks" aria-hidden="true">{{
              marks(entry().threatLevel || 0)
            }}</span>
          </div>
        </aside>
        <section class="specimen-copy">
          <p class="eyebrow">
            {{
              daily()
                ? 'UNA CRIATURA, UN DÍA DE ESTUDIO'
                : 'REGISTRO DEL BESTIARIO'
            }}
          </p>
          <h1>{{ entry().name || 'Espécimen sin nombre' }}</h1>
          @if (entry().commonNames.length) {
            <p class="aliases">
              También conocida como {{ entry().commonNames.join(' · ') }}
            </p>
          }
          <p class="lede">
            {{ entry().description || 'Notas de campo pendientes.' }}
          </p>
          <div class="rule-ornament" aria-hidden="true">❦</div>
          <app-markdown [content]="entry().content || ''" />
          @if (entry().tags.length) {
            <p class="tags">
              <span class="eyebrow">MATERIAS</span>
              {{ entry().tags.join(' / ') }}
            </p>
          }
          <p class="byline">
            Documentado por {{ entry().displayName || 'Archivo Monsterpedia' }}
          </p>
          @if (daily()) {
            <a class="text-link" [routerLink]="['/article', entry().id]"
              >Abrir ficha e historial <span aria-hidden="true">↗</span></a
            >
          }
        </section>
      </div>
    </article>
  `,
})
export class SpecimenComponent {
  readonly entry = input.required<Entry>();
  readonly daily = input(false);
  readonly label = threatLabel;
  imageFailed = false;
  ngOnChanges() {
    this.imageFailed = false;
  }
  marks(value: number) {
    const n = Math.max(0, Math.min(10, Math.round(value)));
    return '▰'.repeat(n) + '▱'.repeat(10 - n);
  }
}
