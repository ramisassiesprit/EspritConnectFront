import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApplicationStatus, JobApplication, JobOffer } from '../../../core/models/job.model';
import { JobService } from '../../../core/services/job.service';

@Component({
  selector: 'app-job-applicants',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './job-applicants.component.html',
  styleUrl: './job-applicants.component.css'
})
export class JobApplicantsComponent implements OnInit {
  job: JobOffer | null = null;
  applications: JobApplication[] = [];
  loading = false;
  error = '';

  readonly applicationStatuses: ApplicationStatus[] = ['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'ACCEPTED'];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly jobService: JobService
  ) {}

  ngOnInit(): void {
    const jobId = this.route.snapshot.paramMap.get('id');
    if (!jobId) {
      this.router.navigate(['/entreprise/jobs']);
      return;
    }
    this.load(jobId);
  }

  applicantDisplayName(application: JobApplication): string {
    const name = `${application.applicantFirstName || ''} ${application.applicantLastName || ''}`.trim();
    if (name) {
      return name;
    }
    return application.applicantId || 'Unknown';
  }

  updateApplicationStatus(application: JobApplication, status: ApplicationStatus): void {
    if (!application.id) {
      return;
    }
    this.jobService.updateApplicationStatus(application.id, status).subscribe({
      next: (updated) => {
        this.applications = this.applications.map((item) => (item.id === updated.id ? updated : item));
      }
    });
  }

  private load(jobId: string): void {
    this.loading = true;
    this.error = '';
    this.jobService.getJobById(jobId).subscribe({
      next: (job) => {
        this.job = job;
        this.jobService.getApplicationsByOffer(jobId).subscribe({
          next: (apps) => {
            this.applications = apps;
            this.loading = false;
          },
          error: () => {
            this.error = 'Unable to load applicants.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'Unable to load job.';
        this.loading = false;
      }
    });
  }
}

