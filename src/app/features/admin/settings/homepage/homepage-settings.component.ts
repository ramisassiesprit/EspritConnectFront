import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { HomepageSettingsService, HomepageSettings, RoleSettingsMap } from '../../../../core/services/homepage-settings.service';
import { UserRole } from '../../../../core/models/user-role.enum';

const COLOR_PRESETS = [
  '#ed1c24', '#dc3545', '#e74c3c', '#ff6b6b',
  '#e67e22', '#f39c12', '#2ecc71', '#27ae60',
  '#3498db', '#2980b9', '#9b59b6', '#8e44ad',
  '#34495e', '#2c3e50', '#95a5a6', '#1abc9c',
];

interface RoleTab {
  role: UserRole;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-homepage-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './homepage-settings.component.html',
  styleUrls: ['./homepage-settings.component.css']
})
export class HomepageSettingsComponent {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}api/admin/settings/homepage`;
  private settingsService = inject(HomepageSettingsService);
  readonly colorPresets = COLOR_PRESETS;

  readonly tabs: RoleTab[] = [
    { role: UserRole.ETUDIANT, label: 'Etudiant', icon: 'school' },
    { role: UserRole.ALUMNI, label: 'Alumni', icon: 'apartment' },
    { role: UserRole.ENSEIGNANT, label: 'Enseignant', icon: 'menu_book' },
    { role: UserRole.ENTREPRISE, label: 'Entreprise', icon: 'business' },
  ];

  activeRole: UserRole = UserRole.ETUDIANT;
  allSettings: RoleSettingsMap = {};

  saving = false;
  uploadProgress = 0;
  uploading = false;
  saveMessage = '';
  saveError = false;

  readonly allTiles = [
    'Catch up + Who\'s online',
    'Recent feed posts',
    'Jobs (Only)',
    'Event',
    'Social media widget',
    'Resources',
  ];

  constructor() {
    this.load();
  }

  get current(): HomepageSettings {
    return this.allSettings[this.activeRole] ?? {
      displayBanner: true,
      primaryColor: '#ed1c24',
      bannerImageUrl: '',
      webTiles: [],
      mobileTiles: []
    };
  }

  set current(val: HomepageSettings) {
    this.allSettings = { ...this.allSettings, [this.activeRole]: val };
  }

  previewUrl(): string | null {
    return this.current.bannerImageUrl || null;
  }

  load() {
    this.http.get<RoleSettingsMap>(this.apiUrl).subscribe({
      next: (res) => {
        this.allSettings = res;
      },
      error: () => {}
    });
  }

  switchTab(role: UserRole) {
    this.activeRole = role;
  }

  updateColor(color: string) {
    this.current = { ...this.current, primaryColor: color };
  }

  updateDisplayBanner(value: boolean) {
    this.current = { ...this.current, displayBanner: value };
  }

  removeTile(index: number, key: 'webTiles' | 'mobileTiles') {
    const s = { ...this.current };
    s[key] = s[key].filter((_, i) => i !== index);
    this.current = s;
  }

  moveUp(index: number, key: 'webTiles' | 'mobileTiles') {
    if (index <= 0) return;
    const arr = [...this.current[key]];
    const v = arr[index];
    arr.splice(index, 1);
    arr.splice(index - 1, 0, v);
    const s = { ...this.current, [key]: arr };
    this.current = s;
  }

  moveDown(index: number, key: 'webTiles' | 'mobileTiles') {
    if (index >= this.current[key].length - 1) return;
    const arr = [...this.current[key]];
    const v = arr[index];
    arr.splice(index, 1);
    arr.splice(index + 1, 0, v);
    const s = { ...this.current, [key]: arr };
    this.current = s;
  }

  restoreTile(tile: string, key: 'webTiles' | 'mobileTiles') {
    if (this.current[key].includes(tile)) return;
    const s = { ...this.current };
    s[key] = [...s[key], tile];
    this.current = s;
  }

  draggedIndex: number | null = null;

  onDragStart(index: number) {
    this.draggedIndex = index;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(index: number, key: 'webTiles' | 'mobileTiles') {
    if (this.draggedIndex === null || this.draggedIndex === index) return;
    const arr = [...this.current[key]];
    const v = arr.splice(this.draggedIndex, 1)[0];
    arr.splice(index, 0, v);
    const s = { ...this.current, [key]: arr };
    this.current = s;
    this.draggedIndex = null;
  }

  getRestorable(key: 'webTiles' | 'mobileTiles'): string[] {
    return this.allTiles.filter(t => !this.current[key].includes(t));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.uploadFile(input.files[0]);
    }
  }

  onDragOverUpload(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDropUpload(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  uploadFile(file: File) {
    this.uploading = true;
    this.uploadProgress = 0;
    const formData = new FormData();
    formData.append('file', file);
    this.http.post<{ url: string }>(`${this.apiUrl}/${this.activeRole}/banner`, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response && event.body) {
          const s = { ...this.current, bannerImageUrl: event.body.url };
          this.current = s;
          this.uploading = false;
        }
      },
      error: () => {
        this.uploading = false;
        this.saveError = true;
        this.saveMessage = 'Failed to upload image.';
      }
    });
  }

  removeImage() {
    const s = { ...this.current, bannerImageUrl: '' };
    this.current = s;
  }

  bannerImageSrc(): string {
    const url = this.current.bannerImageUrl;
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = environment.apiUrl.replace(/\/+$/, '');
    return `${base}${url}`;
  }

  save() {
    this.saving = true;
    this.saveMessage = '';
    this.saveError = false;

    this.settingsService.saveAll(this.allSettings).subscribe({
      next: (res) => {
        this.allSettings = res;
        this.saving = false;
        this.saveMessage = 'Settings saved successfully!';
      },
      error: () => {
        this.saving = false;
        this.saveError = true;
        this.saveMessage = 'Failed to save settings. Please try again.';
      },
    });
  }
}
