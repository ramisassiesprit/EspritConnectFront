import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
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
  geocoding = false;
  message = '';
  error = '';

  search = '';
  showCreateForm = false;
  editingJobId = '';
  selectedImageFile: File | null = null;

  readonly contractTypes: ContractType[] = ['CDI', 'CDD', 'INTERNSHIP', 'FREELANCE', 'PART_TIME', 'VOLUNTEER'];
  readonly statuses: JobStatus[] = ['OPEN', 'CLOSED', 'DRAFT', 'EXPIRED'];
  readonly applicationStatuses: ApplicationStatus[] = ['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'ACCEPTED'];

  form: JobOffer = this.emptyJob();
  private map: any = null;
  private marker: any = null;

  constructor(private readonly jobService: JobService) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  ngOnDestroy(): void {
    this.destroyMap();
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
    this.selectedImageFile = null;
    this.message = '';
    this.error = '';
    setTimeout(() => this.initMap(), 0);
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
    this.selectedImageFile = null;
    setTimeout(() => this.initMap(), 0);
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.editingJobId = '';
    this.form = this.emptyJob();
    this.selectedImageFile = null;
    this.destroyMap();
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
      description: this.form.description?.trim() || undefined,
      deadline: this.form.deadline ? this.form.deadline : undefined,
      status: this.form.status || 'OPEN',
      applyUrl: this.form.applyUrl?.trim() || undefined,
      attachmentUrl: this.form.attachmentUrl?.trim() || undefined,
      latitude: this.form.latitude != null ? Number(this.form.latitude) : undefined,
      longitude: this.form.longitude != null ? Number(this.form.longitude) : undefined
    };

    const request$ = this.editingJobId
      ? this.jobService.updateJob(this.editingJobId, payload)
      : this.jobService.createJob(payload);

    request$.subscribe({
      next: (saved) => {
        const finish = (msg: string) => {
          this.saving = false;
          this.showCreateForm = false;
          this.editingJobId = '';
          this.message = msg;
          this.form = this.emptyJob();
          this.selectedImageFile = null;
          this.destroyMap();
          this.loadJobs();
        };

        if (saved.id && this.selectedImageFile) {
          this.jobService.uploadJobImage(saved.id, this.selectedImageFile).subscribe({
            next: () => finish((isEdit ? 'Job updated successfully.' : 'Job created successfully.') + ' Image uploaded.'),
            error: () => finish((isEdit ? 'Job updated successfully.' : 'Job created successfully.') + ' Image upload failed.')
          });
          return;
        }

        finish(isEdit ? 'Job updated successfully.' : 'Job created successfully.');
      },
      error: (err) => {
        this.saving = false;
        this.error = this.extractApiError(err) || 'Unable to save job.';
      }
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedImageFile = input.files?.[0] || null;
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

  useCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.error = 'Geolocation is not supported by this browser.';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.form.latitude = Number(position.coords.latitude.toFixed(6));
        this.form.longitude = Number(position.coords.longitude.toFixed(6));
        this.updateMapPin(this.form.latitude, this.form.longitude, true);
      },
      () => {
        this.error = 'Unable to read your current location.';
      }
    );
  }

  pickFromLocationText(): void {
    const q = this.form.location?.trim();
    if (!q) {
      this.error = 'Enter location text first.';
      return;
    }
    this.error = '';
    this.geocoding = true;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`)
      .then((r) => r.json())
      .then((rows) => {
        if (!Array.isArray(rows) || !rows.length) {
          this.error = 'No map result found for this location.';
          return;
        }
        this.form.latitude = Number(Number(rows[0].lat).toFixed(6));
        this.form.longitude = Number(Number(rows[0].lon).toFixed(6));
        this.updateMapPin(this.form.latitude, this.form.longitude, true);
      })
      .catch(() => {
        this.error = 'Unable to resolve location on map.';
      })
      .finally(() => {
        this.geocoding = false;
      });
  }

  get mapPinText(): string {
    if (this.form.latitude == null || this.form.longitude == null) {
      return 'No map pin selected';
    }
    return `${this.form.latitude}, ${this.form.longitude}`;
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
      latitude: undefined,
      longitude: undefined,
      contractType: 'INTERNSHIP',
      experienceLevel: '',
      deadline: undefined,
      applyUrl: '',
      attachmentUrl: '',
      status: 'OPEN'
    };
  }

  private extractApiError(err: any): string {
    const data = err?.error;
    if (!data) {
      return '';
    }
    if (typeof data === 'string') {
      return data;
    }
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.join(' | ');
    }
    if (typeof data.errors === 'object' && data.errors !== null) {
      const values = Object.values(data.errors).filter((v) => typeof v === 'string');
      if (values.length > 0) {
        return values.join(' | ');
      }
    }
    return '';
  }

  private initMap(): void {
    if (!this.showCreateForm) {
      return;
    }
    this.loadLeaflet().then(() => {
      const L = (window as any).L;
      const host = document.getElementById('job-map-picker');
      if (!L || !host) {
        return;
      }

      if (this.map) {
        this.map.invalidateSize();
        if (this.form.latitude != null && this.form.longitude != null) {
          this.updateMapPin(this.form.latitude, this.form.longitude, true);
        }
        return;
      }

      const lat = this.form.latitude ?? 36.8065;
      const lng = this.form.longitude ?? 10.1815;

      this.map = L.map('job-map-picker', { doubleClickZoom: false }).setView([lat, lng], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      this.map.on('dblclick', (e: any) => {
        const nextLat = Number(e.latlng.lat.toFixed(6));
        const nextLng = Number(e.latlng.lng.toFixed(6));
        this.form.latitude = nextLat;
        this.form.longitude = nextLng;
        this.updateMapPin(nextLat, nextLng, false);
      });

      if (this.form.latitude != null && this.form.longitude != null) {
        this.updateMapPin(this.form.latitude, this.form.longitude, false);
      }

      setTimeout(() => this.map?.invalidateSize(), 50);
    });
  }

  private updateMapPin(lat: number, lng: number, recenter: boolean): void {
    const L = (window as any).L;
    if (!L || !this.map) {
      return;
    }
    if (!this.marker) {
      this.marker = L.marker([lat, lng]).addTo(this.map);
    } else {
      this.marker.setLatLng([lat, lng]);
    }
    if (recenter) {
      this.map.setView([lat, lng], 13);
    }
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  private async loadLeaflet(): Promise<void> {
    if ((window as any).L) {
      return;
    }

    if (!document.getElementById('leaflet-css')) {
      const css = document.createElement('link');
      css.id = 'leaflet-css';
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
    }

    await new Promise<void>((resolve, reject) => {
      const existing = document.getElementById('leaflet-js') as HTMLScriptElement | null;
      if (existing) {
        if ((window as any).L) {
          resolve();
          return;
        }
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Leaflet load failed')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Leaflet load failed'));
      document.body.appendChild(script);
    });
  }
}
