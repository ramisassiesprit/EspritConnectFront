import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JobService } from '../../../core/services/job.service';

@Component({
  selector: 'app-ats-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ats-card.component.html',
  styleUrls: ['./ats-card.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AtsCardComponent {
  @Input() application: any;
  isGenerating = false;

  constructor(private jobService: JobService) {}

  regenerateSummary() {
    this.isGenerating = true;
    this.jobService.regenerateApplicationSummary(this.application.id).subscribe({
      next: (updatedApp) => {
        this.application.aiSummary = updatedApp.aiSummary;
        this.isGenerating = false;
      },
      error: () => {
        this.isGenerating = false;
      }
    });
  }
}
