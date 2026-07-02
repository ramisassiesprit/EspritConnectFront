import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserRole } from '../models/user-role.enum';

export interface HomepageSettings {
  displayBanner: boolean;
  primaryColor: string;
  bannerImageUrl: string;
  webTiles: string[];
  mobileTiles: string[];
}

export type RoleSettingsMap = Record<UserRole | string, HomepageSettings>;

const DEFAULT_ROLES = [UserRole.ETUDIANT, UserRole.ALUMNI, UserRole.ENSEIGNANT, UserRole.ENTREPRISE];

function defaultSettings(): HomepageSettings {
  return {
    displayBanner: true,
    primaryColor: '#ed1c24',
    bannerImageUrl: '',
    webTiles: ['Catch up + Who\'s online', 'Recent feed posts', 'Jobs (Only)', 'Event', 'Social media widget', 'Resources'],
    mobileTiles: ['Catch up + Who\'s online', 'Recent feed posts', 'Jobs (Only)', 'Event', 'Social media widget', 'Resources'],
  };
}

function defaultRoleMap(): RoleSettingsMap {
  const map: RoleSettingsMap = {};
  for (const role of DEFAULT_ROLES) {
    map[role] = defaultSettings();
  }
  return map;
}

@Injectable({ providedIn: 'root' })
export class HomepageSettingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}api/admin/settings/homepage`;
  readonly backendBase = environment.apiUrl.replace(/\/+$/, '');

  private allSettingsSubject = new BehaviorSubject<RoleSettingsMap>(defaultRoleMap());

  allSettings$ = this.allSettingsSubject.asObservable();

  constructor() {
    this.load();
  }

  private load(): void {
    this.http.get<RoleSettingsMap>(this.apiUrl).subscribe({
      next: (res) => {
        this.allSettingsSubject.next(res);
        const etudiant = res[UserRole.ETUDIANT];
        if (etudiant) {
          this.applyTheme(etudiant.primaryColor);
        }
      },
      error: () => {}
    });
  }

  getSettingsForRole(role: UserRole | string): HomepageSettings {
    const all = this.allSettingsSubject.getValue();
    return all[role] ?? defaultSettings();
  }

  settingsForRole$(role: UserRole | string): Observable<HomepageSettings> {
    return new Observable<HomepageSettings>(observer => {
      const sub = this.allSettings$.subscribe(all => {
        observer.next(all[role] ?? defaultSettings());
      });
      return () => sub.unsubscribe();
    });
  }

  saveAll(settings: RoleSettingsMap): Observable<RoleSettingsMap> {
    return this.http.post<RoleSettingsMap>(this.apiUrl, settings).pipe(
      tap(res => {
        this.allSettingsSubject.next(res);
        const etudiant = res[UserRole.ETUDIANT];
        if (etudiant) {
          this.applyTheme(etudiant.primaryColor);
        }
      })
    );
  }

  saveForRole(role: UserRole | string, settings: HomepageSettings): Observable<HomepageSettings> {
    return this.http.post<HomepageSettings>(`${this.apiUrl}/${role}`, settings).pipe(
      tap(res => {
        const all = this.allSettingsSubject.getValue();
        all[role] = res;
        this.allSettingsSubject.next({ ...all });
      })
    );
  }

  uploadBanner(role: UserRole | string, file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/${role}/banner`, formData);
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
