import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

/**
 * NOTE: This module is kept for legacy compatibility purposes.
 * The application now uses the standalone component approach with
 * app.config.ts and bootstrapApplication in main.ts.
 *
 * This module should not be actively used in the application.
 */
@NgModule({
  declarations: [],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [],
})
export class AppModule {}
