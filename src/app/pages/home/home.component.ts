import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulletinBoardComponent } from './components/bulletin-board/bulletin-board.component';
import { MonsterArticleComponent } from './components/monster-article/monster-article.component';
import { HeroComponent } from '../../shared/hero/hero.component';

@Component({
  selector: 'pages-home',
  imports: [CommonModule, BulletinBoardComponent, MonsterArticleComponent, HeroComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
