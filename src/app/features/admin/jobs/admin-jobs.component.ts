import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ApplicationStatus,
  ContractType,
  JobApplication,
  JobOffer,
  JobStatus
} from '../../../core/models/job.model';
import { JobService } from '../../../core/services/job.service';

@Component({
  selector: 'app-admin-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-jobs.component.html',
  styleUrl: './admin-jobs.component.css'
})
export class AdminJobsComponent implements OnInit {
  jobs: JobOffer[] = [];
  selectedJobId = '';
  selectedJob: JobOffer | null = null;
  applications: JobApplication[] = [];

  loading = false;
  saving = false;
  message = '';
  error = '';

  search = '';
  showCreateForm = false;
  editingJobId = '';

  readonly contractTypes: ContractType[] = ['CDI', 'CDD', 'INTERNSHIP', 'FREELANCE', 'PART_TIME', 'VOLUNTEER'];
  readonly statuses: JobStatus[] = ['OPEN', 'CLOSED', 'DRAFT', 'EXPIRED'];
  readonly applicationStatuses: ApplicationStatus[] = ['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'ACCEPTED'];

  form: JobOffer = this.emptyJob();

  constructor(private readonly jobService: JobService) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  get filteredJobs(): JobOffer[] {
    const q = this.search.trim().toLowerCase();
    if (!q) {
      return this.jobs;
    }
    return this.jobs.filter((job) =>
      job.title.toLowerCase().includes(q)
      || (job.company || '').toLowerCase().includes(q)
      || (job.location || '').toLowerCase().includes(q)
    );
  }

  selectJob(job: JobOffer): void {
    if (!job.id) {
      return;
    }
    this.selectedJobId = job.id;
    this.selectedJob = job;
    this.loadApplications(job.id);
  }

  startCreate(): void {
    this.showCreateForm = true;
    this.editingJobId = '';
    this.form = this.emptyJob();
    this.message = '';
    this.error = '';
  }

  startEdit(job: JobOffer): void {
    this.showCreateForm = true;
    this.editingJobId = job.id || '';
    this.form = {
      ...job,
      deadline: job.deadline ? String(job.deadline).slice(0, 10) : undefined
    };
    this.message = '';
    this.error = '';
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.editingJobId = '';
    this.form = this.emptyJob();
  }

  saveJob(): void {
    this.message = '';
    this.error = '';

    if (!this.form.title.trim()) {
      this.error = 'Title is required.';
      return;
    }

    const isEdit = !!this.editingJobId;
    this.saving = true;
    const payload: JobOffer = {
      ...this.form,
      title: this.form.title.trim(),
      company: this.form.company?.trim() || undefined,
      industry: this.form.industry?.trim() || undefined,
      location: this.form.location?.trim() || undefined,
      experienceLevel: this.form.experienceLevel?.trim() || undefined,
      description: this.form.description?.trim() || undefined
    };

    const request$ = this.editingJobId
      ? this.jobService.updateJob(this.editingJobId, payload)
      : this.jobService.createJob(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.showCreateForm = false;
        this.editingJobId = '';
        this.message = isEdit ? 'Job updated successfully.' : 'Job created successfully.';
        this.form = this.emptyJob();
        this.loadJobs();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'Unable to save job.';
      }
    });
  }

  deleteJob(job: JobOffer): void {
    if (!job.id) {
      return;
    }
    if (!confirm(`Delete "${job.title}"?`)) {
      return;
    }

    this.message = '';
    this.error = '';

    this.jobService.deleteJob(job.id).subscribe({
      next: () => {
        if (this.selectedJobId === job.id) {
          this.selectedJobId = '';
          this.selectedJob = null;
          this.applications = [];
        }
        this.message = 'Job deleted successfully.';
        this.loadJobs();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Unable to delete job.';
      }
    });
  }

  updateApplicationStatus(application: JobApplication, status: ApplicationStatus): void {
    if (!application.id) {
      return;
    }

    this.jobService.updateApplicationStatus(application.id, status).subscribe({
      next: (updated) => {
        this.applications = this.applications.map((item) =>
          item.id === updated.id ? updated : item
        );
        this.message = 'Application status updated.';
      },
      error: (err) => {
        this.error = err?.error?.message || 'Unable to update application status.';
      }
    });
  }

  private loadJobs(): void {
    this.loading = true;
    this.jobService.getAllJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.loading = false;
        if (this.selectedJobId) {
          const match = jobs.find((j) => j.id === this.selectedJobId);
          if (match) {
            this.selectedJob = match;
            this.loadApplications(this.selectedJobId);
          } else {
            this.selectedJobId = '';
            this.selectedJob = null;
            this.applications = [];
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Unable to load jobs.';
      }
    });
  }

  private loadApplications(jobId: string): void {
    this.jobService.getApplicationsByOffer(jobId).subscribe({
      next: (apps) => {
        this.applications = apps;
      },
      error: () => {
        this.applications = [];
      }
    });
  }

  private emptyJob(): JobOffer {
    return {
      title: '',
      description: '',
      company: '',
      industry: '',
      location: '',
      contractType: 'INTERNSHIP',
      experienceLevel: '',
      deadline: undefined,
      status: 'OPEN'
    };
  }
}
