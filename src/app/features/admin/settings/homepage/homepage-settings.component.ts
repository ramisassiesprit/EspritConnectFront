import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpEventType } from '@angular/common/http';
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
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './homepage-settings.component.html',
  styleUrls: ['./homepage-settings.component.css']
})
export class HomepageSettingsComponent {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}api/admin/settings/homepage`;
  private settingsService = inject(HomepageSettingsService);
  readonly colorPresets = COLOR_PRESETS;

  settings: HomepageSettings = { displayBanner: true, primaryColor: '#ed1c24', bannerImageUrl: '' };
  saving = false;
  uploadProgress = 0;
  uploading = false;
  saveMessage = '';
  saveError = false;

  previewUrl: string | null = null;

  // Tile display placeholder data
  readonly availableTiles = [
    'Catch up + Who\'s online',
    'Recent feed posts',
    'Jobs (Only)',
    'Event',
    'Social media widget',
    'Resources',
  ];

  tiles: string[] = [
    'Catch up + Who\'s online',
    'Recent feed posts',
    'Jobs (Only)',
    'Event',
    'Social media widget',
    'Resources',
  ];

  addTile() {
    // add a placeholder tile
    const next = this.availableTiles.find(t => !this.tiles.includes(t)) || 'Custom tile';
    this.tiles.push(next);
  }

  removeTile(index: number) {
    this.tiles.splice(index, 1);
  }

  moveUp(index: number) {
    if (index <= 0) return;
    const v = this.tiles[index];
    this.tiles.splice(index, 1);
    this.tiles.splice(index - 1, 0, v);
  }

  moveDown(index: number) {
    if (index >= this.tiles.length - 1) return;
    const v = this.tiles[index];
    this.tiles.splice(index, 1);
    this.tiles.splice(index + 1, 0, v);
  }

  constructor() {
    this.load();
  }

  load() {
    this.http.get<HomepageSettings>(this.apiUrl).subscribe({
      next: (res) => {
        this.settings = res;
        if (res.bannerImageUrl) {
          this.previewUrl = res.bannerImageUrl;
        }
      },
      error: () => {}
    });
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
        this.settings = res;
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
