import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-engagement-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="insights-page">
      <h1 class="insights-page__title">Engagement Analytics</h1>
      <div class="insights-page__placeholder">
        <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
          <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
        </svg>
        <p>Engagement metrics and analytics will appear here.</p>
        <span>Track user engagement across the platform</span>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .insights-page {
      padding: 2rem 2.5rem;
      max-width: 1400px;
      min-height: 100vh;
      background: #f8fafc;
      font-family: 'Inter', 'Segoe UI', sans-serif;
    }
    .insights-page__title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 2rem;
    }
    .insights-page__placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 4rem 2rem;
      background: #fff;
      border: 2px dashed #e2e8f0;
      border-radius: 16px;
      text-align: center;
      color: #94a3b8;
    }
    .insights-page__placeholder p {
      font-size: 1.1rem;
      font-weight: 600;
      color: #475569;
      margin: 0;
    }
    .insights-page__placeholder span {
      font-size: 0.85rem;
    }
  `]
})
export class EngagementAnalyticsComponent {}
