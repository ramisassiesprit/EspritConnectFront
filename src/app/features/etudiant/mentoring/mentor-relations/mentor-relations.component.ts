import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mentor-relations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mentor-relations.component.html',
  styleUrl: './mentor-relations.component.css'
})
export class MentorRelationsComponent {
  activeTab: 'current' | 'declined' | 'canceled' | 'past' = 'current';

  setTab(tab: 'current' | 'declined' | 'canceled' | 'past'): void {
    this.activeTab = tab;
  }
}
