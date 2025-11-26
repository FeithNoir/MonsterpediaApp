import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulletinBoardComponent } from './components/bulletin-board/bulletin-board.component';
import { MonsterArticleComponent } from './components/monster-article/monster-article.component';
import { HeroComponent } from '../../shared/hero/hero.component';
import { ArticleOfTheDayComponent } from '../../shared/article-of-the-day/article-of-the-day.component';
import { SeeMoreArticlesComponent } from '../../shared/see-more-articles/see-more-articles.component';

@Component({
  selector: 'pages-home',
  imports: [
    CommonModule, 
    BulletinBoardComponent, 
    MonsterArticleComponent, 
    HeroComponent,
    ArticleOfTheDayComponent,
    SeeMoreArticlesComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
