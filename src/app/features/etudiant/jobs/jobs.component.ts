import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { JobApplication, JobOffer } from '../../../core/models/job.model';
import { JobService } from '../../../core/services/job.service';
import { DEFAULT_JOBS_SETTINGS, JobsSettings, JobsSettingsService } from '../../../core/services/jobs-settings.service';
import { ProfileService } from '../../../core/services/profile.service';
import { environment } from '../../../../environments/environment';

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
  myApplicationsByJobId: Record<string, JobApplication> = {};
  studentFieldOfStudy = '';
  showRecommendedOnly = false;
  jobsSettings: JobsSettings = DEFAULT_JOBS_SETTINGS;

  loading = false;
  applying = false;
  error = '';
  message = '';
  cvFile: File | null = null;
  coverLetterText = '';

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
  selectedStudyFieldOptions: string[] = [];
  selectedLocationOptions: string[] = [];

  studyFieldOptions = [
    'G\u00e9nie Logiciel',
    'Informatique',
    'G\u00e9nie T\u00e9l\u00e9communications',
    'G\u00e9nie \u00c9lectrom\u00e9canique',
    'G\u00e9nie Civil',
    'Management & Business',
    'Science des Donn\u00e9es',
    'Syst\u00e8mes Embarqu\u00e9s',
    'Cloud & S\u00e9curit\u00e9',
    'R\u00e9seaux & T\u00e9l\u00e9coms',
    'Finance & Comptabilit\u00e9',
    'Marketing & Ventes'
  ];

  locationOptions = [
    'Tunis',
    'Sfax',
    'Sousse',
    'Paris',
    'Remote'
  ];

  isContractDropdownOpen = false;
  isStudyFieldDropdownOpen = false;
  isLocationDropdownOpen = false;
  contractSearch = '';
  studyFieldSearch = '';
  locationSearch = '';

  constructor(
    private readonly jobService: JobService,
    private readonly jobsSettingsService: JobsSettingsService,
    private readonly profileService: ProfileService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.jobsSettingsService.settings$.subscribe((settings) => {
      this.jobsSettings = settings;
      this.contractTypeOptions = this.buildContractTypeOptions(settings.employmentTypes);
    });
    this.loadStudentFieldOfStudy();
    this.loadMyApplications();
    this.loadJobs();

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
      const normalizedJobTargetFields = (job.targetFields || []).map((field) => this.normalizeStudyField(field));
      const matchStudyFields = !this.selectedStudyFieldOptions.length
        || this.selectedStudyFieldOptions.some((selected) => normalizedJobTargetFields.includes(this.normalizeStudyField(selected)));
      const matchLocation = !this.selectedLocationOptions.length || this.selectedLocationOptions.includes(job.location || '');

      return matchGlobal && matchCompany && matchTitle && matchContract && matchStudyFields && matchLocation;
    });
  }

  get recommendedJobs(): JobOffer[] {
    const studentField = this.normalizeStudyField(this.studentFieldOfStudy);
    if (!studentField) {
      return [];
    }
    return this.filteredJobs.filter((job) =>
      (job.targetFields || []).some((field) => this.normalizeStudyField(field) === studentField)
    );
  }

  get displayedJobs(): JobOffer[] {
    if (!this.showRecommendedOnly) {
      return this.filteredJobs;
    }
    return this.recommendedJobs;
  }

  get showExternalJobsWidget(): boolean {
    const widget = this.jobsSettings.externalJobsWidget;
    return this.jobsSettings.displayExternalJobListingWidgetOnJobsPage
      && !!(widget.bannerImageUrl || widget.title || widget.description || widget.linkUrl || widget.buttonText);
  }

  get externalJobsWidget() {
    return this.jobsSettings.externalJobsWidget;
  }

  toggleRecommendedOnly(): void {
    this.showRecommendedOnly = !this.showRecommendedOnly;
  }

  get filteredContractTypeOptions(): { label: string; value: string }[] {
    const q = this.contractSearch.trim().toLowerCase();
    if (!q) {
      return this.contractTypeOptions;
    }
    return this.contractTypeOptions.filter((o) => o.label.toLowerCase().includes(q));
  }

  get filteredStudyFieldOptions(): string[] {
    const q = this.studyFieldSearch.trim().toLowerCase();
    if (!q) {
      return this.studyFieldOptions;
    }
    return this.studyFieldOptions.filter((o) => o.toLowerCase().includes(q));
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
    this.selectedStudyFieldOptions = [];
    this.selectedLocationOptions = [];
    this.contractSearch = '';
    this.studyFieldSearch = '';
    this.locationSearch = '';
    this.isContractDropdownOpen = false;
    this.isStudyFieldDropdownOpen = false;
    this.isLocationDropdownOpen = false;
  }

  toggleDropdown(type: 'contract' | 'studyField' | 'location'): void {
    this.isContractDropdownOpen = type === 'contract' ? !this.isContractDropdownOpen : false;
    this.isStudyFieldDropdownOpen = type === 'studyField' ? !this.isStudyFieldDropdownOpen : false;
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

  toggleSelectedStudyField(value: string): void {
    const index = this.selectedStudyFieldOptions.indexOf(value);
    if (index >= 0) {
      this.selectedStudyFieldOptions.splice(index, 1);
    } else {
      this.selectedStudyFieldOptions.push(value);
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

  openApplyLink(): void {
    const url = this.selectedJob?.applyUrl?.trim();
    if (!url) {
      this.error = 'No apply link is available for this job.';
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  openExternalJobsWidget(): void {
    const url = this.externalJobsWidget.linkUrl?.trim();
    if (!url) {
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  getApplicationForJob(jobId?: string): JobApplication | null {
    if (!jobId) {
      return null;
    }
    return this.myApplicationsByJobId[jobId] || null;
  }

  hasApplied(jobId?: string): boolean {
    return !!this.getApplicationForJob(jobId);
  }

  applicationStatusLabel(jobId?: string): string {
    const app = this.getApplicationForJob(jobId);
    return app?.status || 'PENDING';
  }

  applicationStateClass(jobId?: string): string {
    const status = this.applicationStatusLabel(jobId);
    switch (status) {
      case 'ACCEPTED':
        return 'state-accepted';
      case 'REJECTED':
        return 'state-rejected';
      case 'SHORTLISTED':
        return 'state-shortlisted';
      case 'REVIEWED':
        return 'state-reviewed';
      case 'PENDING':
      default:
        return 'state-pending';
    }
  }

  applicationStatusMessage(jobId?: string): string {
    const status = this.applicationStatusLabel(jobId);
    switch (status) {
      case 'ACCEPTED':
        return 'Congratulations. The company accepted your application and will contact you with next steps.';
      case 'REJECTED':
        return 'The company has closed this application. You can still apply to other opportunities.';
      case 'SHORTLISTED':
        return 'Great progress. You are shortlisted and may be contacted soon for the next stage.';
      case 'REVIEWED':
        return 'Your application was reviewed. The company is now deciding on the next step.';
      case 'PENDING':
      default:
        return 'Your application is submitted and waiting for the company review.';
    }
  }

  onCvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.cvFile = file;
  }

  submitOnPlatform(): void {
    if (!this.selectedJob?.id) {
      this.error = 'No job selected.';
      return;
    }
    if (this.hasApplied(this.selectedJob.id)) {
      this.error = `You already applied to this job. Current status: ${this.applicationStatusLabel(this.selectedJob.id)}.`;
      return;
    }
    if (!this.cvFile) {
      this.error = 'Please attach your CV before submitting.';
      return;
    }

    this.applying = true;
    this.error = '';
    this.message = '';

    this.jobService.uploadApplicationCv(this.cvFile).subscribe({
      next: (cvUrl) => {
        this.jobService.apply({
          jobOfferId: this.selectedJob!.id!,
          cvUrl,
          coverLetterUrl: this.coverLetterText?.trim() || undefined
        }).subscribe({
          next: () => {
            this.applying = false;
            this.cvFile = null;
            this.coverLetterText = '';
            this.message = 'Application submitted on platform. Company can now review your profile and CV.';
            this.loadMyApplications();
          },
          error: (err) => {
            this.applying = false;
            this.error = err?.error?.message || 'Unable to submit your application.';
          }
        });
      },
      error: (err) => {
        this.applying = false;
        this.error = err?.error?.message || 'Unable to upload CV.';
      }
    });
  }

  resolveImageUrl(url?: string): string {
    if (!url || !url.trim()) {
      return 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&h=200&fit=crop';
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/EspritConnect')) {
      return `${window.location.protocol}//${window.location.hostname}:8086${url}`;
    }
    const base = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  }

  resolveSettingsImageUrl(url?: string): string {
    return this.jobsSettingsService.resolveImageUrl(url || '');
  }

  private loadJobs(): void {
    this.loading = true;
    this.jobService.getAllJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs.filter((j) => j.status === 'OPEN');
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load jobs.';
        this.loading = false;
      }
    });
  }

  private loadStudentFieldOfStudy(): void {
    this.profileService.getMyEspritProfile().subscribe({
      next: (profile) => {
        this.studentFieldOfStudy = profile?.fieldOfStudy || '';
      },
      error: () => {
        this.studentFieldOfStudy = '';
      }
    });
  }

  private normalizeStudyField(value?: string | null): string {
    if (!value) {
      return '';
    }
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private buildContractTypeOptions(employmentTypes: string[]): { label: string; value: string }[] {
    const fallback = [
      { label: 'CDI', value: 'CDI' },
      { label: 'CDD', value: 'CDD' },
      { label: 'Internship', value: 'INTERNSHIP' },
      { label: 'Freelance', value: 'FREELANCE' },
      { label: 'Part-time', value: 'PART_TIME' },
      { label: 'Volunteer', value: 'VOLUNTEER' }
    ];

    if (!employmentTypes?.length) {
      return fallback;
    }

    const mapped = employmentTypes.map((label) => ({
      label,
      value: this.employmentTypeToContractValue(label)
    }));

    return mapped.length ? mapped : fallback;
  }

  private employmentTypeToContractValue(label: string): string {
    const normalized = label.trim().toLowerCase();
    if (normalized.includes('part')) return 'PART_TIME';
    if (normalized.includes('internship')) return 'INTERNSHIP';
    if (normalized.includes('freelance')) return 'FREELANCE';
    if (normalized.includes('volunteer')) return 'VOLUNTEER';
    if (normalized.includes('cdd')) return 'CDD';
    if (normalized.includes('job offer')) return 'CDI';
    if (normalized.includes('full')) return 'CDI';
    return label.trim().toUpperCase().replace(/\s+/g, '_');
  }

  private loadMyApplications(): void {
    this.jobService.getMyApplications().subscribe({
      next: (applications) => {
        const nextMap: Record<string, JobApplication> = {};
        for (const app of applications) {
          if (app.jobOfferId) {
            nextMap[app.jobOfferId] = app;
          }
        }
        this.myApplicationsByJobId = nextMap;
      },
      error: () => {
        this.myApplicationsByJobId = {};
      }
    });
  }

  private loadJobDetails(jobId: string): void {
    this.loading = true;
    this.jobService.getJobById(jobId).subscribe({
      next: (job) => {
        this.selectedJob = job;
        this.cvFile = null;
        this.coverLetterText = '';
        this.message = '';
        this.error = '';
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load job details.';
        this.loading = false;
      }
    });
  }

  mapEmbedUrl(job: JobOffer): SafeResourceUrl | null {
    if (job.latitude == null || job.longitude == null) {
      return null;
    }
    const lat = Number(job.latitude);
    const lng = Number(job.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }
    const delta = 0.02;
    const left = lng - delta;
    const right = lng + delta;
    const top = lat + delta;
    const bottom = lat - delta;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
