import { Component, OnInit, signal } from '@angular/core';
import { IMonsterGirl, IStats } from '../../../../core/interfaces/monster-girl.interface';
import { v4 as uuidv4 } from 'uuid';
import { CommonModule } from '@angular/common';
import { MarkdownModule, provideMarkdown } from 'ngx-markdown';

@Component({
  selector: 'pages-monster-article',
  imports: [CommonModule, MarkdownModule],
  providers: [provideMarkdown()],
  templateUrl: './monster-article.component.html',
  styleUrl: './monster-article.component.css',
})
export class MonsterArticleComponent implements OnInit {
  imgUrl: string = './lamia.jpg';

  monsterGirl = signal<IMonsterGirl | null>(null);
  private readonly lamiaArticleMarkdown: string = `
# Estudio sobre la Lamia
*Observaciones sobre la Lamia obscura y sus hábitos arcanos.*

Las Lamias son criaturas de fábula y espanto, con torso femenino y cuerpo serpentiforme
desde la cintura. Se deslizan con gracia venenosa entre ruinas olvidadas, selvas húmedas y
criptas malditas, mezclando la belleza de lo humano con lo letal de lo ofidio.

![Una Lamia en descanso.](URL_IMAGEN_AQUI_SI_ES_PARTE_DEL_ARTICULO)
*Una Lamia en descanso.*

## Origen y Denominación
Su nombre proviene del mito griego de Lamia, una reina convertida en monstruo tras
perder a sus hijos, asociada desde entonces a lo oculto y a la sed de conocimiento
prohibido.

## Hábitats Comunes
*   **Templos Abandonados:** Lugares donde la magia residual abunda y las
    sombras protegen.
*   **Selvas Oscuras:** Su camuflaje natural y sigilo les permite dominar
    estos entornos.
*   **Criptas Subterráneas:** Preferidas por las lamias con inclinación
    necromántica.

Evitan terrenos helados y zonas excesivamente urbanizadas.

## Comportamiento y Alimentación
Astutas y solitarias, las lamias suelen ser cazadoras nocturnas. Su dieta incluye
mamíferos medianos, pero también se rumorea que absorben energía vital de sus víctimas
mediante encantamientos.

## Atributos Relevantes
*   **Lengua Bífida Sensora:** Detecta feromonas y magia latente.
*   **Colmillos Venenosos:** Su mordida puede paralizar o inducir visiones.
*   **Conocimiento Arcaico:** Muchas lamias estudian grimorios antiguos.
*   **Hipnosis Visual:** Capaces de paralizar con la mirada.

---
*Las observaciones aquí presentadas son fruto de estudios compilados y pueden presentar
variaciones regionales. Se recomienda cautela al aproximarse a especímenes salvajes.*
`;

  ngOnInit(): void {
    this.processAndLoadArticle();
  }

  private processAndLoadArticle(): void {
    let articleContent = this.lamiaArticleMarkdown.replace(
      'URL_IMAGEN_AQUI_SI_ES_PARTE_DEL_ARTICULO',
      this.imgUrl
    );

    const lamiaStats: IStats = {
      strength: 6,
      agility: 8,
      intelligence: 9,
      charm: 7,
      magic: 9,
    };

    const lamiaData: IMonsterGirl = {
      id: uuidv4(),
      name: 'Lamia',
      description: 'Observaciones sobre la Lamia obscura y sus hábitos arcanos.',
      commonNames: ['Naga Oscura', 'Serpiente Hechicera'],
      species: 'Lamia',
      clasification: ['Críptida', 'Reptiliana Mágica'],
      alignment: 'Caótico Neutral',
      threatLevel: 7,
      longevity: 'Varios siglos',
      stats: lamiaStats,
      tags: ['Lamia', 'Críptida', 'Magia Antigua', 'Serpiente'],
      image: this.imgUrl,
      entries: articleContent,
    };

    this.monsterGirl.set(lamiaData);
  }
}
