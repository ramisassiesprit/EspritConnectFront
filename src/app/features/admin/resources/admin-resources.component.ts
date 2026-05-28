import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ResourceFile, ResourceFolder, ResourceFolderDetails } from '../../../core/models/resource.model';
import { ResourceService } from '../../../core/services/resource.service';

@Component({
  selector: 'app-admin-resources',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-resources.component.html',
  styleUrl: './admin-resources.component.css'
})
export class AdminResourcesComponent implements OnInit {
  folders: ResourceFolder[] = [];
  selectedFolderId = '';
  selectedFolderDetails: ResourceFolderDetails | null = null;

  folderName = '';
  editFolderName = '';
  uploadFile: File | null = null;
  createCoverFile: File | null = null;
  editCoverFile: File | null = null;
  createCoverFileName = '';
  editCoverFileName = '';
  searchTerm = '';

  loading = false;
  message = '';
  error = '';

  folderPage = 1;
  filePage = 1;
  readonly pageSize = 5;

  constructor(private readonly resourceService: ResourceService) {}

  ngOnInit(): void {
    this.loadFolders();
  }

  get filteredFolders(): ResourceFolder[] {
    const t = this.searchTerm.trim().toLowerCase();
    if (!t) {
      return this.folders;
    }
    return this.folders.filter(f => f.name.toLowerCase().includes(t) || f.creatorName.toLowerCase().includes(t));
  }

  get pagedFolders(): ResourceFolder[] {
    const start = (this.folderPage - 1) * this.pageSize;
    return this.filteredFolders.slice(start, start + this.pageSize);
  }

  get folderTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredFolders.length / this.pageSize));
  }

  get filteredFiles(): ResourceFile[] {
    if (!this.selectedFolderDetails) {
      return [];
    }
    const t = this.searchTerm.trim().toLowerCase();
    if (!t) {
      return this.selectedFolderDetails.files;
    }
    return this.selectedFolderDetails.files.filter(f => f.name.toLowerCase().includes(t));
  }

  get pagedFiles(): ResourceFile[] {
    const start = (this.filePage - 1) * this.pageSize;
    return this.filteredFiles.slice(start, start + this.pageSize);
  }

  get fileTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredFiles.length / this.pageSize));
  }

  get totalFilesCount(): number {
    return this.folders.reduce((sum, f) => sum + (f.itemsCount || 0), 0);
  }

  get folderSizeStats(): { label: string; value: number }[] {
    return this.folders
      .slice()
      .sort((a, b) => (b.itemsCount || 0) - (a.itemsCount || 0))
      .slice(0, 6)
      .map((f) => ({ label: f.name, value: f.itemsCount || 0 }));
  }

  get folderTrendStats(): { label: string; value: number }[] {
    const now = new Date();
    const keys: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short' });
      keys.push({ key, label });
    }

    const counts: Record<string, number> = {};
    for (const folder of this.folders) {
      if (!folder.createdAt) continue;
      const d = new Date(folder.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts[key] = (counts[key] || 0) + 1;
    }

    return keys.map((k) => ({ label: k.label, value: counts[k.key] || 0 }));
  }

  get selectedFolderFileTypeStats(): { label: string; value: number }[] {
    const files = this.selectedFolderDetails?.files || [];
    const counts: Record<string, number> = {};
    for (const file of files) {
      const t = this.fileTypeLabel(file.mimeType, file.name);
      counts[t] = (counts[t] || 0) + 1;
    }
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
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

  prevFolderPage(): void { this.folderPage = Math.max(1, this.folderPage - 1); }
  nextFolderPage(): void { this.folderPage = Math.min(this.folderTotalPages, this.folderPage + 1); }
  prevFilePage(): void { this.filePage = Math.max(1, this.filePage - 1); }
  nextFilePage(): void { this.filePage = Math.min(this.fileTotalPages, this.filePage + 1); }

  loadFolders(): void {
    this.loading = true;
    this.error = '';
    this.resourceService.getFolders().subscribe({
      next: (folders) => {
        this.folders = folders;
        this.folderPage = 1;
        this.loading = false;
        if (this.selectedFolderId) {
          this.loadFolderDetails(this.selectedFolderId);
        }
      },
      error: () => {
        this.error = 'Unable to load resource folders.';
        this.loading = false;
      }
    });
  }

  loadFolderDetails(folderId: string): void {
    if (!folderId) {
      this.selectedFolderDetails = null;
      return;
    }

    this.selectedFolderId = folderId;
    this.filePage = 1;
    this.resourceService.getFolderDetails(folderId).subscribe({
      next: (folder) => {
        this.selectedFolderDetails = folder;
        this.editFolderName = folder.name;
        this.editCoverFile = null;
        this.editCoverFileName = '';
      },
      error: () => {
        this.error = 'Unable to load selected folder details.';
      }
    });
  }

  createFolder(): void {
    this.message = '';
    this.error = '';

    const trimmedName = this.folderName.trim();
    if (!trimmedName) {
      this.error = 'Folder name is required.';
      return;
    }

    this.resourceService.createFolder({
      name: trimmedName
    }).subscribe({
      next: (folder) => {
        this.folderName = '';
        if (this.createCoverFile) {
          this.resourceService.uploadFolderCover(folder.id, this.createCoverFile).subscribe({
            next: () => {
              this.createCoverFile = null;
              this.createCoverFileName = '';
              this.message = 'Folder created successfully.';
              this.loadFolders();
              this.loadFolderDetails(folder.id);
            },
            error: () => {
              this.createCoverFile = null;
              this.createCoverFileName = '';
              this.message = 'Folder created, but cover upload failed.';
              this.loadFolders();
              this.loadFolderDetails(folder.id);
            }
          });
          return;
        }
        this.message = 'Folder created successfully.';
        this.loadFolders();
        this.loadFolderDetails(folder.id);
      },
      error: () => {
        this.error = 'Unable to create folder.';
      }
    });
  }

  updateFolder(): void {
    this.message = '';
    this.error = '';

    if (!this.selectedFolderId) {
      this.error = 'Select a folder first.';
      return;
    }

    const name = this.editFolderName.trim();
    if (!name) {
      this.error = 'Folder name is required.';
      return;
    }

    this.resourceService.updateFolder(this.selectedFolderId, {
      name
    }).subscribe({
      next: (folder) => {
        if (this.editCoverFile) {
          this.resourceService.uploadFolderCover(folder.id, this.editCoverFile).subscribe({
            next: () => {
              this.editCoverFile = null;
              this.editCoverFileName = '';
              this.message = 'Folder updated successfully.';
              this.loadFolders();
              this.loadFolderDetails(this.selectedFolderId);
            },
            error: () => {
              this.editCoverFile = null;
              this.editCoverFileName = '';
              this.message = 'Folder updated, but cover upload failed.';
              this.loadFolders();
              this.loadFolderDetails(this.selectedFolderId);
            }
          });
          return;
        }
        this.message = 'Folder updated successfully.';
        this.loadFolders();
        this.loadFolderDetails(this.selectedFolderId);
      },
      error: () => {
        this.error = 'Unable to update folder.';
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.uploadFile = input.files?.[0] || null;
  }

  onCreateCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.createCoverFile = input.files?.[0] || null;
    this.createCoverFileName = this.createCoverFile?.name || '';
  }

  onEditCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editCoverFile = input.files?.[0] || null;
    this.editCoverFileName = this.editCoverFile?.name || '';
  }

  submitUpload(): void {
    this.message = '';
    this.error = '';

    if (!this.selectedFolderId) {
      this.error = 'Select a folder first.';
      return;
    }

    if (!this.uploadFile) {
      this.error = 'Choose a file to upload.';
      return;
    }

    this.resourceService.uploadFile(this.selectedFolderId, this.uploadFile).subscribe({
      next: () => {
        this.message = 'File uploaded successfully.';
        this.uploadFile = null;
        this.loadFolders();
        this.loadFolderDetails(this.selectedFolderId);
      },
      error: () => {
        this.error = 'Unable to upload file.';
      }
    });
  }

  downloadFile(file: ResourceFile): void {
    this.resourceService.downloadFile(file.downloadUrl).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.error = 'Unable to download this file right now.';
          return;
        }

        const contentDisposition = response.headers.get('content-disposition') || '';
        const headerName = this.extractFileName(contentDisposition);
        const fileName = headerName || file.name;

        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      },
      error: () => {
        this.error = 'Unable to download this file right now.';
      }
    });
  }

  previewFile(file: ResourceFile): void {
    this.resourceService.downloadFile(file.downloadUrl).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.error = 'Unable to preview this file right now.';
          return;
        }
        const blobUrl = window.URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      },
      error: () => {
        this.error = 'Unable to preview this file right now.';
      }
    });
  }

  deleteFolder(folderId: string): void {
    if (!confirm('Delete this folder and all its files?')) {
      return;
    }

    this.message = '';
    this.error = '';

    this.resourceService.deleteFolder(folderId).subscribe({
      next: () => {
        if (this.selectedFolderId === folderId) {
          this.selectedFolderId = '';
          this.selectedFolderDetails = null;
        }
        this.message = 'Folder deleted successfully.';
        this.loadFolders();
      },
      error: () => {
        this.error = 'Unable to delete folder.';
      }
    });
  }

  deleteFile(fileId: string): void {
    if (!confirm('Delete this file?')) {
      return;
    }

    this.message = '';
    this.error = '';

    this.resourceService.deleteFile(fileId).subscribe({
      next: () => {
        this.message = 'File deleted successfully.';
        if (this.selectedFolderId) {
          this.loadFolders();
          this.loadFolderDetails(this.selectedFolderId);
        }
      },
      error: () => {
        this.error = 'Unable to delete file.';
      }
    });
  }

  private extractFileName(contentDisposition: string): string | null {
    const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1]);
    }
    const simpleMatch = /filename="?([^";]+)"?/i.exec(contentDisposition);
    return simpleMatch?.[1] || null;
  }

  private fileTypeLabel(mimeType?: string, fileName?: string): string {
    const mt = (mimeType || '').toLowerCase();
    if (mt.includes('pdf')) return 'PDF';
    if (mt.includes('word') || mt.includes('document')) return 'DOC';
    if (mt.includes('image')) return 'Image';
    if (mt.includes('sheet') || mt.includes('excel')) return 'Spreadsheet';
    if (mt.includes('presentation') || mt.includes('powerpoint')) return 'Presentation';
    const ext = (fileName?.split('.').pop() || '').toUpperCase();
    return ext || 'Other';
  }
}
