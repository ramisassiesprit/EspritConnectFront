import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { HomepageSettingsService, HomepageSettings } from '../../../../core/services/homepage-settings.service';

const COLOR_PRESETS = [
  '#ed1c24', '#dc3545', '#e74c3c', '#ff6b6b',
  '#e67e22', '#f39c12', '#2ecc71', '#27ae60',
  '#3498db', '#2980b9', '#9b59b6', '#8e44ad',
  '#34495e', '#2c3e50', '#95a5a6', '#1abc9c',
];

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

  settings: HomepageSettings = { displayBanner: true, primaryColor: '#ed1c24', bannerImageUrl: '', webTiles: [], mobileTiles: [] };
  saving = false;
  uploadProgress = 0;
  uploading = false;
  saveMessage = '';
  saveError = false;

  previewUrl: string | null = null;

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

  load() {
    this.http.get<HomepageSettings>(this.apiUrl).subscribe({
      next: (res) => {
        this.settings = {
          ...res,
          webTiles: res.webTiles ?? [],
          mobileTiles: res.mobileTiles ?? []
        };
        if (res.bannerImageUrl) {
          this.previewUrl = res.bannerImageUrl;
        }
      },
      error: () => {}
    });
  }

  removeTile(index: number, key: 'webTiles' | 'mobileTiles') {
    this.settings = {
      ...this.settings,
      [key]: this.settings[key].filter((_, i) => i !== index)
    };
  }

  moveUp(index: number, key: 'webTiles' | 'mobileTiles') {
    if (index <= 0) return;
    const arr = [...this.settings[key]];
    const v = arr[index];
    arr.splice(index, 1);
    arr.splice(index - 1, 0, v);
    this.settings = { ...this.settings, [key]: arr };
  }

  moveDown(index: number, key: 'webTiles' | 'mobileTiles') {
    if (index >= this.settings[key].length - 1) return;
    const arr = [...this.settings[key]];
    const v = arr[index];
    arr.splice(index, 1);
    arr.splice(index + 1, 0, v);
    this.settings = { ...this.settings, [key]: arr };
  }

  restoreTile(tile: string, key: 'webTiles' | 'mobileTiles') {
    if (this.settings[key].includes(tile)) return;
    this.settings = {
      ...this.settings,
      [key]: [...this.settings[key], tile]
    };
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
    const arr = [...this.settings[key]];
    const v = arr.splice(this.draggedIndex, 1)[0];
    arr.splice(index, 0, v);
    this.settings = { ...this.settings, [key]: arr };
    this.draggedIndex = null;
  }

  getRestorable(key: 'webTiles' | 'mobileTiles'): string[] {
    return this.allTiles.filter(t => !this.settings[key].includes(t));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.uploadFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
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
    this.http.post<{ url: string }>(`${this.apiUrl}/banner`, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response && event.body) {
          this.settings.bannerImageUrl = event.body.url;
          this.previewUrl = event.body.url;
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
    this.previewUrl = null;
    this.settings.bannerImageUrl = '';
  }

  bannerImageSrc(): string {
    if (!this.previewUrl) return '';
    if (this.previewUrl.startsWith('http')) return this.previewUrl;
    const base = environment.apiUrl.replace(/\/+$/, '');
    return `${base}${this.previewUrl}`;
  }

  save() {
    this.saving = true;
    this.saveMessage = '';
    this.saveError = false;

    this.http.post<HomepageSettings>(this.apiUrl, this.settings).subscribe({
      next: (res) => {
        this.settings = {
          ...res,
          webTiles: res.webTiles ?? [],
          mobileTiles: res.mobileTiles ?? []
        };
        if (res.bannerImageUrl) {
          this.previewUrl = res.bannerImageUrl;
        }
        this.saving = false;
        this.saveMessage = 'Settings saved successfully!';
        this.settingsService.refresh();
      },
      error: () => {
        this.saving = false;
        this.saveError = true;
        this.saveMessage = 'Failed to save settings. Please try again.';
      },
    });
  }
}
