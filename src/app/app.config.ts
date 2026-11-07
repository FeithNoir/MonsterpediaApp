import {
  ApplicationConfig,
  inject,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideFirebaseApp } from '@angular/fire/app';
import { provideAuth } from '@angular/fire/auth';
import { provideFirestore } from '@angular/fire/firestore';
import { provideStorage } from '@angular/fire/storage';
import { FIREBASE } from './core/firebase';
import { routes } from './app.routes';
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    provideFirebaseApp(() => inject(FIREBASE).app),
    provideAuth(() => inject(FIREBASE).auth),
    provideFirestore(() => inject(FIREBASE).db),
    provideStorage(() => inject(FIREBASE).storage),
  ],
};
