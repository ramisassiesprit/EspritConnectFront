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
              this.message = 'Folder created successfully.';
              this.loadFolders();
              this.loadFolderDetails(folder.id);
            },
            error: () => {
              this.createCoverFile = null;
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
              this.message = 'Folder updated successfully.';
              this.loadFolders();
              this.loadFolderDetails(this.selectedFolderId);
            },
            error: () => {
              this.editCoverFile = null;
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
  }

  onEditCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editCoverFile = input.files?.[0] || null;
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
}
