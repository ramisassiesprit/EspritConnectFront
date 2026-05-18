import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceFile, ResourceFolder, ResourceFolderDetails } from '../../../core/models/resource.model';
import { ResourceService } from '../../../core/services/resource.service';
import { environment } from '../../../../environments/environment';

type ViewMode = 'GRID' | 'LIST';
type SortType = 'LAST_UPDATED' | 'A_TO_Z';

@Component({
  selector: 'app-resources',
  imports: [CommonModule, FormsModule],
  templateUrl: './resources.component.html',
  styleUrl: './resources.component.css'
})
export class ResourcesComponent implements OnInit {
  viewMode: ViewMode = 'GRID';
  sortType: SortType = 'LAST_UPDATED';
  searchTerm = '';
  folderSearchTerm = '';

  folders: ResourceFolder[] = [];
  selectedFolder: ResourceFolderDetails | null = null;
  loading = false;
  error = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly resourceService: ResourceService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((query) => {
      const queryMode = (query.get('viewMode') || '').toUpperCase();
      this.viewMode = queryMode === 'LIST_VIEW' ? 'LIST' : 'GRID';
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadFolderDetails(id);
      } else {
        this.selectedFolder = null;
        this.loadFolders();
      }
    });
  }

  get filteredFolders(): ResourceFolder[] {
    const term = this.searchTerm.trim().toLowerCase();
    const sorted = this.sortFolders(this.folders);
    if (!term) {
      return sorted;
    }

    return sorted.filter((folder) =>
      folder.name.toLowerCase().includes(term)
      || folder.creatorName.toLowerCase().includes(term)
    );
  }

  get filteredFiles(): ResourceFile[] {
    if (!this.selectedFolder) {
      return [];
    }

    const sorted = this.sortFiles(this.selectedFolder.files);
    const term = this.folderSearchTerm.trim().toLowerCase();
    if (!term) {
      return sorted;
    }

    return sorted.filter((file) => file.name.toLowerCase().includes(term));
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { viewMode: mode === 'LIST' ? 'LIST_VIEW' : 'GRID_VIEW' },
      queryParamsHandling: 'merge'
    });
  }

  setSortType(sortType: SortType): void {
    this.sortType = sortType;
  }

  openFolder(folderId: string): void {
    this.router.navigate(['/etudiant/resources', folderId], {
      queryParams: { viewMode: this.viewMode === 'LIST' ? 'LIST_VIEW' : 'GRID_VIEW' }
    });
  }

  backToAllResources(): void {
    this.router.navigate(['/etudiant/resources'], {
      queryParams: { viewMode: this.viewMode === 'LIST' ? 'LIST_VIEW' : 'GRID_VIEW' }
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
        const headerFileName = this.extractFileName(contentDisposition);
        const fileName = headerFileName || this.safeFileName(file.name);

        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      },
      error: () => {
        this.error = 'Unable to download this file right now.';
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  private loadFolders(): void {
    this.loading = true;
    this.error = '';
    this.resourceService.getFolders().subscribe({
      next: (folders) => {
        this.folders = folders;
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load resources right now.';
        this.loading = false;
      }
    });
  }

  private loadFolderDetails(folderId: string): void {
    this.loading = true;
    this.error = '';
    this.resourceService.getFolderDetails(folderId).subscribe({
      next: (folder) => {
        this.selectedFolder = folder;
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load folder details.';
        this.loading = false;
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

  private sortFolders(folders: ResourceFolder[]): ResourceFolder[] {
    const copy = [...folders];
    if (this.sortType === 'A_TO_Z') {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      copy.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return copy;
  }

  private sortFiles(files: ResourceFile[]): ResourceFile[] {
    const copy = [...files];
    if (this.sortType === 'A_TO_Z') {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      copy.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return copy;
  }

  private safeFileName(name: string): string {
    return name.replace(/[\\/:*?"<>|]/g, '_');
  }

  resolveCoverUrl(url?: string): string {
    if (!url || !url.trim()) {
      return '/assets/folder-default.jpg';
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/EspritConnect')) {
      return `${window.location.protocol}//${window.location.hostname}:8086${url}`;
    }
    const base = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  }
}
