import { Component, inject } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { IEntry } from '../../../../core/interfaces/entry.interface';
import { AuthService } from '../../../../core/services/auth.service';
import { IUser } from '../../../../core/interfaces/auth.interface';

@Component({
  selector: 'pages-bulletin-board',
  imports: [],
  templateUrl: './bulletin-board.component.html',
  styleUrl: './bulletin-board.component.css'
})
export class BulletinBoardComponent {
  protected imgUrl: string = './lamia.jpg';
  private authService = inject(AuthService);
  private currentUser: IUser = this.authService.getCurrentUser()!;

  protected mosterGirlData: IEntry = {
    id: uuidv4(),
    title: 'Lamia',
      name: 'Lamia',
      description:
        'Observaciones sobre la Lamia obscura y sus hábitos arcanos.',
      commonNames: ['Naga Oscura', 'Serpiente Hechicera'],
      species: 'Lamia',
      clasification: ['Críptida', 'Reptiliana Mágica'],
      alignment: 'Caótico Neutral',
      threatLevel: 7,
      longevity: 'Varios siglos',
      images: [this.imgUrl],
      content: '',
      author: this.currentUser,
      date: new Date(Date.now()),
      tags: ['Lamia', 'Críptida', 'Magia Antigua', 'Serpiente'],
  }
}
