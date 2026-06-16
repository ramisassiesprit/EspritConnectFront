import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HomepageSettings {
  displayBanner: boolean;
  primaryColor: string;
  bannerImageUrl: string;
  webTiles: string[];
  mobileTiles: string[];
}

@Injectable({ providedIn: 'root' })
export class HomepageSettingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}api/admin/settings/homepage`;
  readonly backendBase = environment.apiUrl.replace(/\/+$/, '');

  private settingsSubject = new BehaviorSubject<HomepageSettings>({
    displayBanner: true,
    primaryColor: '#ed1c24',
    bannerImageUrl: '',
    webTiles: ['Catch up + Who\'s online', 'Recent feed posts', 'Jobs (Only)', 'Event', 'Social media widget', 'Resources'],
    mobileTiles: ['Catch up + Who\'s online', 'Recent feed posts', 'Jobs (Only)', 'Event', 'Social media widget', 'Resources']
  });

  settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.load();
  }

  private load(): void {
    this.http.get<HomepageSettings>(this.apiUrl).subscribe({
      next: (res) => {
        this.settingsSubject.next(res);
        this.applyTheme(res.primaryColor);
      },
      error: () => {}
    });
  }

  private applyTheme(color: string): void {
    document.documentElement.style.setProperty('--esprit-red', color);
    document.documentElement.style.setProperty('--color-primary', color);
  }

  resolveImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${this.backendBase}${path}`;
  }

  refresh(): void {
    this.load();
  }
}