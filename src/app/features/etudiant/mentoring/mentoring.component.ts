import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-mentoring',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="mentoring-shell">
      <section class="mentoring-hero">
        <div>
          <p class="mentoring-kicker">Career support</p>
          <h1>Mentoring</h1>
          <p class="mentoring-copy">Review requests, active relationships, and mentoring history in one place.</p>
        </div>
      </section>

      <nav class="mentoring-tabs" aria-label="Mentoring sections">
        <a routerLink="find" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Find a Mentor</a>
        <a routerLink="relations" routerLinkActive="active">Mentoring Relationships</a>
        <a routerLink="settings" routerLinkActive="active">Settings</a>
      </nav>

      <section class="mentoring-content">
        <router-outlet></router-outlet>
      </section>
    </div>
  `,
  styleUrl: './mentoring.component.css'
})
export class MentoringComponent {
}
