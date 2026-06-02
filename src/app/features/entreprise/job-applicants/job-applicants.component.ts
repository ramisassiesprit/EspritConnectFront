import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApplicationStatus, JobApplication, JobOffer } from '../../../core/models/job.model';
import { UserRole } from '../../../core/models/user-role.enum';
import { AuthService } from '../../../core/services/auth.service';
import { JobService } from '../../../core/services/job.service';
import { RecommendationService } from '../../../core/services/recommendation.service';

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
  recommendedCandidates: any[] = [];
  loading = false;
  error = '';
  activeTab: 'applicants' | 'recommended' = 'applicants';
  backRoute = '/entreprise/jobs';

  readonly applicationStatuses: ApplicationStatus[] = ['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'ACCEPTED'];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly jobService: JobService,
    private readonly recommendationService: RecommendationService
  ) {}

  ngOnInit(): void {
    const role = this.authService.currentUser()?.role;
    this.backRoute = role === UserRole.ADMIN ? '/admin/jobs' : '/entreprise/jobs';

    const jobId = this.route.snapshot.paramMap.get('id');
    if (!jobId) {
      this.router.navigate([this.backRoute]);
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

  statusClass(status?: ApplicationStatus | null): string {
    switch (status) {
      case 'ACCEPTED':
        return 'status-accepted';
      case 'REJECTED':
        return 'status-rejected';
      case 'SHORTLISTED':
        return 'status-shortlisted';
      case 'REVIEWED':
        return 'status-reviewed';
      case 'PENDING':
      default:
        return 'status-pending';
    }
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
            this.recommendationService.getJobCandidates(jobId).subscribe({
              next: (candidates) => {
                this.recommendedCandidates = candidates;
                this.loading = false;
              },
              error: () => {
                this.error = 'Unable to load recommended candidates.';
                this.loading = false;
              }
            });
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
