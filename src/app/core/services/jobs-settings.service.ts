import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExternalJobsWidgetSettings {
  bannerImageUrl: string;
  language: string;
  title: string;
  description: string;
  linkUrl: string;
  buttonText: string;
}

export interface JobsSettings {
  employmentTypes: string[];
  displayJobWidgetOnFeedPage: boolean;
  displayExternalJobListingWidgetOnJobsPage: boolean;
  externalJobsWidget: ExternalJobsWidgetSettings;
  automatedFeed: {
    provider: 'handshake' | 'symplicity' | 'custom';
    feedUrl: string;
  };
}

export const DEFAULT_JOBS_SETTINGS: JobsSettings = {
  employmentTypes: [
    'Full-time',
    'Part-time',
    'Final project Internship',
    'Job offer',
    'Short Internship'
  ],
  displayJobWidgetOnFeedPage: true,
  displayExternalJobListingWidgetOnJobsPage: true,
  externalJobsWidget: {
    bannerImageUrl: '',
    language: 'en-GB',
    title: '',
    description: '',
    linkUrl: '',
    buttonText: ''
  },
  automatedFeed: {
    provider: 'handshake',
    feedUrl: ''
  }
};

@Injectable({ providedIn: 'root' })
export class JobsSettingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}api/admin/settings/jobs`;
  readonly backendBase = environment.apiUrl.replace(/\/+$/, '');

  private settingsSubject = new BehaviorSubject<JobsSettings>(DEFAULT_JOBS_SETTINGS);
  settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.load();
  }

  refresh(): void {
    this.load();
  }

  resolveImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${this.backendBase}${path}`;
  }

  private load(): void {
    this.http.get<JobsSettings>(this.apiUrl).subscribe({
      next: (res) => this.settingsSubject.next(this.normalize(res)),
      error: () => {}
    });
  }

  private normalize(settings: JobsSettings): JobsSettings {
    return {
      ...DEFAULT_JOBS_SETTINGS,
      ...settings,
      employmentTypes: settings.employmentTypes?.length
        ? settings.employmentTypes
        : DEFAULT_JOBS_SETTINGS.employmentTypes,
      externalJobsWidget: {
        ...DEFAULT_JOBS_SETTINGS.externalJobsWidget,
        ...(settings.externalJobsWidget ?? {})
      },
      automatedFeed: {
        ...DEFAULT_JOBS_SETTINGS.automatedFeed,
        ...(settings.automatedFeed ?? {})
      }
    };
  }
}
