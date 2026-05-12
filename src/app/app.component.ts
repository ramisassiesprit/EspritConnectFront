import { Component, inject } from '@angular/core';
import {
  Router,
  RouterOutlet,
  Event,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'EspritConnectFrontend';
  isLoading = false;
  private router = inject(Router);

  constructor() {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        this.isLoading = true;
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        // Small delay to make sure the loader doesn't flash too fast
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      }
    });
  }
}
