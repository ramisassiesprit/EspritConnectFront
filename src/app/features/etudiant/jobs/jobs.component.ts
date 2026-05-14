import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { JobApplication, JobOffer } from '../../../core/models/job.model';
import { JobService } from '../../../core/services/job.service';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.css']
})
export class JobsComponent implements OnInit {
  jobs: JobOffer[] = [];
  selectedJob: JobOffer | null = null;
  myApplications: JobApplication[] = [];

  loading = false;
  error = '';
  message = '';

  search = '';
  filterCompany = '';
  filterTitle = '';
  filterContractType = '';
  filterIndustry = '';
  filterLocation = '';

  contractTypeOptions = [
    { label: 'CDI', value: 'CDI' },
    { label: 'CDD', value: 'CDD' },
    { label: 'Internship', value: 'INTERNSHIP' },
    { label: 'Freelance', value: 'FREELANCE' },
    { label: 'Part-time', value: 'PART_TIME' },
    { label: 'Volunteer', value: 'VOLUNTEER' }
  ];

  selectedContractTypes: string[] = [];
  selectedIndustryOptions: string[] = [];
  selectedLocationOptions: string[] = [];

  industryOptions = [
    'Accounting',
    'Administrative',
    'Arts and Design',
    'Business Development',
    'Community & Social Services',
    'Consulting'
  ];

  locationOptions = [
    'Tunis',
    'Sfax',
    'Sousse',
    'Paris',
    'Remote'
  ];

  isContractDropdownOpen = false;
  isIndustryDropdownOpen = false;
  isLocationDropdownOpen = false;
  contractSearch = '';
  industrySearch = '';
  locationSearch = '';

  cvUrl = '';
  coverLetterUrl = '';

  constructor(
    private readonly jobService: JobService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadJobs();
    this.loadMyApplications();

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadJobDetails(id);
      } else {
        this.selectedJob = null;
      }
    });
  }

  get filteredJobs(): JobOffer[] {
    const q = this.search.trim().toLowerCase();
    return this.jobs.filter((job) => {
      const matchGlobal = !q
        || job.title.toLowerCase().includes(q)
        || (job.company || '').toLowerCase().includes(q)
        || (job.description || '').toLowerCase().includes(q);

      const matchCompany = !this.filterCompany || (job.company || '').toLowerCase().includes(this.filterCompany.toLowerCase());
      const matchTitle = !this.filterTitle || job.title.toLowerCase().includes(this.filterTitle.toLowerCase());
      const matchContract = !this.selectedContractTypes.length || this.selectedContractTypes.includes((job.contractType || '').toUpperCase());
      const matchIndustry = !this.selectedIndustryOptions.length || this.selectedIndustryOptions.includes(job.industry || '');
      const matchLocation = !this.selectedLocationOptions.length || this.selectedLocationOptions.includes(job.location || '');

      return matchGlobal && matchCompany && matchTitle && matchContract && matchIndustry && matchLocation;
    });
  }

  get filteredContractTypeOptions(): { label: string; value: string }[] {
    const q = this.contractSearch.trim().toLowerCase();
    if (!q) {
      return this.contractTypeOptions;
    }
    return this.contractTypeOptions.filter((o) => o.label.toLowerCase().includes(q));
  }

  get filteredIndustryOptions(): string[] {
    const q = this.industrySearch.trim().toLowerCase();
    if (!q) {
      return this.industryOptions;
    }
    return this.industryOptions.filter((o) => o.toLowerCase().includes(q));
  }

  get filteredLocationOptions(): string[] {
    const q = this.locationSearch.trim().toLowerCase();
    if (!q) {
      return this.locationOptions;
    }
    return this.locationOptions.filter((o) => o.toLowerCase().includes(q));
  }

  resetFilters(): void {
    this.search = '';
    this.filterCompany = '';
    this.filterTitle = '';
    this.filterContractType = '';
    this.filterIndustry = '';
    this.filterLocation = '';
    this.selectedContractTypes = [];
    this.selectedIndustryOptions = [];
    this.selectedLocationOptions = [];
    this.contractSearch = '';
    this.industrySearch = '';
    this.locationSearch = '';
    this.isContractDropdownOpen = false;
    this.isIndustryDropdownOpen = false;
    this.isLocationDropdownOpen = false;
  }

  toggleDropdown(type: 'contract' | 'industry' | 'location'): void {
    this.isContractDropdownOpen = type === 'contract' ? !this.isContractDropdownOpen : false;
    this.isIndustryDropdownOpen = type === 'industry' ? !this.isIndustryDropdownOpen : false;
    this.isLocationDropdownOpen = type === 'location' ? !this.isLocationDropdownOpen : false;
  }

  preventScrollBubble(event: WheelEvent): void {
    const panel = event.currentTarget as HTMLElement | null;
    if (!panel) {
      return;
    }
    const delta = event.deltaY;
    const atTop = panel.scrollTop === 0;
    const atBottom = Math.ceil(panel.scrollTop + panel.clientHeight) >= panel.scrollHeight;
    if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
      event.preventDefault();
    }
    event.stopPropagation();
  }

  toggleSelectedContractType(value: string): void {
    const index = this.selectedContractTypes.indexOf(value);
    if (index >= 0) {
      this.selectedContractTypes.splice(index, 1);
    } else {
      this.selectedContractTypes.push(value);
    }
  }

  toggleSelectedIndustry(value: string): void {
    const index = this.selectedIndustryOptions.indexOf(value);
    if (index >= 0) {
      this.selectedIndustryOptions.splice(index, 1);
    } else {
      this.selectedIndustryOptions.push(value);
    }
  }

  toggleSelectedLocation(value: string): void {
    const index = this.selectedLocationOptions.indexOf(value);
    if (index >= 0) {
      this.selectedLocationOptions.splice(index, 1);
    } else {
      this.selectedLocationOptions.push(value);
    }
  }

  openJob(jobId: string | undefined): void {
    if (!jobId) {
      return;
    }
    this.router.navigate(['/etudiant/jobs', jobId]);
  }

  backToList(): void {
    this.router.navigate(['/etudiant/jobs']);
  }

  hasApplied(jobId: string | undefined): boolean {
    if (!jobId) {
      return false;
    }
    return this.myApplications.some((a) => a.jobOfferId === jobId);
  }

  applyToSelectedJob(): void {
    if (!this.selectedJob?.id) {
      return;
    }

    this.error = '';
    this.message = '';

    if (this.hasApplied(this.selectedJob.id)) {
      this.message = 'You already applied for this job.';
      return;
    }

    const payload: JobApplication = {
      jobOfferId: this.selectedJob.id,
      cvUrl: this.cvUrl || undefined,
      coverLetterUrl: this.coverLetterUrl || undefined
    };

    this.jobService.apply(payload).subscribe({
      next: () => {
        this.message = 'Application submitted successfully.';
        this.cvUrl = '';
        this.coverLetterUrl = '';
        this.loadMyApplications();
      },
      error: () => {
        this.error = 'Unable to submit application.';
      }
    });
  }

  private loadJobs(): void {
    this.loading = true;
    this.jobService.getAllJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs.filter((j) => j.status === 'OPEN' || j.status === 'DRAFT');
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load jobs.';
        this.loading = false;
      }
    });
  }

  private loadJobDetails(jobId: string): void {
    this.loading = true;
    this.jobService.getJobById(jobId).subscribe({
      next: (job) => {
        this.selectedJob = job;
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load job details.';
        this.loading = false;
      }
    });
  }

  private loadMyApplications(): void {
    this.jobService.getMyApplications().subscribe({
      next: (apps) => {
        this.myApplications = apps;
      },
      error: () => {
        this.myApplications = [];
      }
    });
  }
}
