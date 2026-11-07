// Preserve historical hash links; the Hosting rewrite now serves clean deep links.
if (location.hash.startsWith('#/') && !location.hash.startsWith('#//')) {
  history.replaceState(null, '', location.hash.slice(1));
}

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);
