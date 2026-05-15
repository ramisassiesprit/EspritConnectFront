import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-group-photos-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section-card placeholder-card">
      <h3>Photos & Albums</h3>
      <p>This section is coming soon.</p>
    </div>
  `,
  styles: [`
    .placeholder-card {
      padding: 40px;
      text-align: center;
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }
    h3 { margin-top: 0; color: #1c1e21; }
    p { color: #65676b; }
  `]
})
export class GroupPhotosTabComponent {}
