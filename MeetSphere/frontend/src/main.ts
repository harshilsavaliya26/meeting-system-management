import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ErrorHandler } from '@angular/core';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { GlobalErrorHandler, errorTelemetryInterceptor } from './app/error-telemetry';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })),
    provideHttpClient(withInterceptors([errorTelemetryInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
}).catch(err => console.error(err));
