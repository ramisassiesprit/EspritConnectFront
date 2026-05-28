import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ContractType,
  JobOffer,
  JobStatus
} from '../../../core/models/job.model';
import { UserRole } from '../../../core/models/user-role.enum';
import { AuthService } from '../../../core/services/auth.service';
import { JobService } from '../../../core/services/job.service';
import { UserService } from '../../../core/services/User.service';

@Component({
  selector: 'app-admin-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-jobs.component.html',
  styleUrl: './admin-jobs.component.css'
})
export class AdminJobsComponent implements OnInit {
  jobs: JobOffer[] = [];

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
  form: JobOffer = this.emptyJob();
  private map: any = null;
  private marker: any = null;

  currentRole: UserRole | null = null;
  companyAccountName = '';

  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentRole = this.authService.currentUser()?.role || null;
    if (this.currentRole === UserRole.ENTREPRISE) {
      this.userService.getCurrentUser().subscribe({
        next: (user) => {
          const fromProfile = user.companyName?.trim();
          const fallback = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
          this.companyAccountName = fromProfile || fallback || 'Entreprise';
          this.form.company = this.companyAccountName;
        },
        error: () => {
          this.companyAccountName = 'Entreprise';
          this.form.company = this.companyAccountName;
        }
      });
    }
    this.loadJobs();

    if (this.isCompanyMode && this.isCreateRoute()) {
      this.startCreate();
    }
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

  get jobStatusStats(): { label: string; value: number }[] {
    const counts: Record<string, number> = {};
    for (const job of this.jobs) {
      const key = job.status || 'UNKNOWN';
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }

  get contractTypeStats(): { label: string; value: number }[] {
    const counts: Record<string, number> = {};
    for (const job of this.jobs) {
      const key = job.contractType || 'N/A';
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }

  get recentJobsTrend(): { label: string; value: number }[] {
    const now = new Date();
    const keys: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short' });
      keys.push({ key, label });
    }

    const counts: Record<string, number> = {};
    for (const job of this.jobs) {
      if (!job.createdAt) continue;
      const d = new Date(job.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts[key] = (counts[key] || 0) + 1;
    }

    return keys.map((k) => ({ label: k.label, value: counts[k.key] || 0 }));
  }

  maxStatValue(stats: { value: number }[]): number {
    return Math.max(1, ...stats.map((s) => s.value));
  }

  totalStatValue(stats: { value: number }[]): number {
    return stats.reduce((sum, s) => sum + s.value, 0);
  }

  donutBackground(stats: { label: string; value: number }[], palette: string[]): string {
    const total = this.totalStatValue(stats);
    if (total <= 0) {
      return 'conic-gradient(#e2e8f0 0 360deg)';
    }
    let current = 0;
    const segments: string[] = [];
    stats.forEach((item, idx) => {
      const angle = (item.value / total) * 360;
      const start = current;
      const end = current + angle;
      const color = palette[idx % palette.length];
      segments.push(`${color} ${start}deg ${end}deg`);
      current = end;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }

  selectJob(job: JobOffer): void {
    if (!job.id) {
      return;
    }
    if (this.isAdminMode) {
      this.router.navigate(['/admin/jobs', job.id, 'applicants']);
      return;
    }
  }

  viewApplicants(job: JobOffer): void {
    if (!job.id) {
      return;
    }
    if (this.isCompanyMode) {
      this.router.navigate(['/entreprise/jobs', job.id, 'applicants']);
      return;
    }
    this.router.navigate(['/admin/jobs', job.id, 'applicants']);
  }

  startCreate(): void {
    if (!this.isCompanyMode) {
      return;
    }
    this.showCreateForm = true;
    this.editingJobId = '';
    this.form = this.emptyJob();
    this.form.company = this.companyAccountName || this.form.company;
    this.selectedImageFile = null;
    this.message = '';
    this.error = '';
    setTimeout(() => this.initMap(), 0);
  }

  openCreatePage(): void {
    if (!this.isCompanyMode) {
      return;
    }
    this.router.navigate(['/entreprise/jobs/new']);
  }

  startEdit(job: JobOffer): void {
    if (!this.isCompanyMode) {
      return;
    }
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
    if (this.isCompanyMode && this.isCreateRoute()) {
      this.router.navigate(['/entreprise/jobs']);
      return;
    }
    this.showCreateForm = false;
    this.editingJobId = '';
    this.form = this.emptyJob();
    this.selectedImageFile = null;
    this.destroyMap();
  }

  saveJob(): void {
    if (!this.isCompanyMode) {
      this.error = 'Only company accounts can create or edit jobs.';
      return;
    }
    this.message = '';
    this.error = '';

    if (!this.form.title.trim()) {
      this.error = 'Title is required.';
      return;
    }

    const isEdit = !!this.editingJobId;
    this.saving = true;
    const payload: JobOffer = {
      title: this.form.title.trim(),
      industry: this.form.industry?.trim() || undefined,
      location: this.form.location?.trim() || undefined,
      contractType: this.form.contractType,
      experienceLevel: this.form.experienceLevel?.trim() || undefined,
      description: this.form.description?.trim() || undefined,
      deadline: this.form.deadline ? this.form.deadline : undefined,
      status: this.form.status || 'PENDING',
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
          if (this.isCompanyMode && this.isCreateRoute()) {
            this.router.navigate(['/entreprise/jobs']);
            return;
          }
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
    if (!this.isCompanyMode && !this.isAdminMode) {
      this.error = 'Only company and admin accounts can delete jobs.';
      return;
    }
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
        this.message = 'Job deleted successfully.';
        this.loadJobs();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Unable to delete job.';
      }
    });
  }

  approveJob(job: JobOffer): void {
    if (!job.id || !this.isAdminMode) {
      return;
    }
    this.jobService.approveJob(job.id).subscribe({
      next: () => {
        this.message = 'Job approved.';
        this.loadJobs();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Unable to approve job.';
      }
    });
  }

  rejectJob(job: JobOffer): void {
    if (!job.id || !this.isAdminMode) {
      return;
    }
    this.jobService.rejectJob(job.id).subscribe({
      next: () => {
        this.message = 'Job rejected.';
        this.loadJobs();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Unable to reject job.';
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
    const loader$ = this.isAdminMode
      ? this.jobService.getAllJobs()
      : this.jobService.getMyJobs();
    loader$.subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Unable to load jobs.';
      }
    });
  }

  private emptyJob(): JobOffer {
    return {
      title: '',
      description: '',
      company: this.companyAccountName || '',
      industry: '',
      location: '',
      latitude: undefined,
      longitude: undefined,
      contractType: 'INTERNSHIP',
      experienceLevel: '',
      deadline: undefined,
      applyUrl: '',
      attachmentUrl: '',
      status: 'PENDING'
    };
  }

  get isAdminMode(): boolean {
    return this.currentRole === UserRole.ADMIN;
  }

  get isCompanyMode(): boolean {
    return this.currentRole === UserRole.ENTREPRISE;
  }

  get isCreateMode(): boolean {
    return this.isCompanyMode && this.isCreateRoute();
  }

  jobStatusClass(status?: JobStatus): string {
    switch (status) {
      case 'OPEN':
        return 'job-status job-status--open';
      case 'PENDING':
        return 'job-status job-status--pending';
      case 'REJECTED':
        return 'job-status job-status--rejected';
      case 'CLOSED':
        return 'job-status job-status--closed';
      default:
        return 'job-status';
    }
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

  private isCreateRoute(): boolean {
    return this.route.snapshot.routeConfig?.path === 'jobs/new';
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
