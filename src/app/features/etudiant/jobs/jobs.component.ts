import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { JobOffer } from '../../../core/models/job.model';
import { JobService } from '../../../core/services/job.service';
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

  constructor(
    private readonly jobService: JobService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
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

  openApplyLink(): void {
    const url = this.selectedJob?.applyUrl?.trim();
    if (!url) {
      this.error = 'No apply link is available for this job.';
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
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

  private loadJobDetails(jobId: string): void {
    this.loading = true;
    this.jobService.getJobById(jobId).subscribe({
      next: (job) => {
        this.selectedJob = job;
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
