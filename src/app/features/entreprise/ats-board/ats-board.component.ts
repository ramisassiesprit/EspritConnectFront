import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';

import { AtsCardComponent } from '../ats-card/ats-card.component';
import { JobService } from '../../../core/services/job.service';

@Component({
  selector: 'app-ats-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, AtsCardComponent],
  templateUrl: './ats-board.component.html',
  styleUrls: ['./ats-board.component.css']
})
export class AtsBoardComponent implements OnInit {
  jobs: any[] = [];
  selectedJobId: string = '';
  // Columns
  pending: any[] = [];
  reviewed: any[] = [];
  shortlisted: any[] = [];
  accepted: any[] = [];
  rejected: any[] = [];

  constructor(private jobService: JobService) {}

  ngOnInit(): void {
    // Replace with real job ID or fetch from route params
    this.loadJobs();
  }

  loadJobs() {
    this.jobService.getMyJobs().subscribe(jobs => {
      this.jobs = jobs;
      if (this.jobs.length > 0) {
        this.selectedJobId = this.jobs[0].id;
        this.loadApplications(this.selectedJobId);
      }
    });
  }

  onJobChange(event: any) {
    this.selectedJobId = event.target.value;
    this.loadApplications(this.selectedJobId);
  }

  loadApplications(jobOfferId: string) {
    this.jobService.getApplicationsByOffer(jobOfferId).subscribe(apps => {
      this.pending = apps.filter((a: any) => a.status === 'PENDING');
      this.reviewed = apps.filter((a: any) => a.status === 'REVIEWED');
      this.shortlisted = apps.filter((a: any) => a.status === 'SHORTLISTED');
      this.accepted = apps.filter((a: any) => a.status === 'ACCEPTED');
      this.rejected = apps.filter((a: any) => a.status === 'REJECTED');
    });
  }

  drop(event: CdkDragDrop<any[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      
      const app = event.container.data[event.currentIndex];
      this.jobService.updateApplicationStatus(app.id, newStatus as any).subscribe();
    }
  }
}
