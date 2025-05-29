import { Component } from '@angular/core';
import { IMonsterGirl, IStats } from '../../../../core/interfaces/monster-girl.interface';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'pages-bulletin-board',
  imports: [],
  templateUrl: './bulletin-board.component.html',
  styleUrl: './bulletin-board.component.css'
})
export class BulletinBoardComponent {
  protected imgUrl: string = './lamia.jpg';
  protected stats: IStats = {
    strength: 75,
    agility: 65,
    intelligence: 70,
    charm: 80,
    magic: 60
  }
  protected mosterGirlData: IMonsterGirl = {
    id: uuidv4(),
    name: 'Lamia Venenosa',
    description: 'Lamia de los Valles Sombríos',
    commonNames: ['Lamia Venenosa', 'Lamia obscura', 'Lamia de los Valles Sombríos'],
    species: 'Serpenthia Escamadorada',
    clasification: ['Humanoide Serpentina', 'Críptida Terrestre'],
    alignment: 'Neutral Maligna (frecuente)',
    threatLevel: 4,
    longevity: '120-150 ciclos solares',
    stats: this.stats,
  }
}
