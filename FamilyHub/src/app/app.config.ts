import {
  ApplicationConfig,
  provideZoneChangeDetection,
  isDevMode,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAnimations } from '@angular/platform-browser/animations';
// Remove provideClientHydration since we're not using SSR in development mode

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    importProvidersFrom(MatSnackBarModule),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    // Remove provideClientHydration for development to fix the hydration error
    provideAnimations(),
  ],
};
