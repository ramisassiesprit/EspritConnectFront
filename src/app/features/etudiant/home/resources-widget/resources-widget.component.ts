import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ResourceFile, ResourceFolder, ResourceFolderDetails } from '../../../../core/models/resource.model';
import { ResourceService } from '../../../../core/services/resource.service';

@Component({
  selector: 'app-resources-widget',
  imports: [CommonModule, RouterLink],
  templateUrl: './resources-widget.component.html',
  styleUrl: './resources-widget.component.css'
})
export class ResourcesWidgetComponent implements OnInit {
  filesPreview: ResourceFile[] = [];
  loading = false;

  constructor(private readonly resourceService: ResourceService) {}

  ngOnInit(): void {
    this.loadResourcesPreview();
  }

  downloadFile(file: ResourceFile): void {
    this.resourceService.downloadFile(file.downloadUrl).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          return;
        }

        const contentDisposition = response.headers.get('content-disposition') || '';
        const headerFileName = this.extractFileName(contentDisposition);
        const fileName = headerFileName || file.name;

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
        // Keep widget silent on failures to preserve home UX.
      }
    });
  }

  private loadResourcesPreview(): void {
    this.loading = true;

    this.resourceService.getFolders().pipe(
      switchMap((folders: ResourceFolder[]) => {
        if (folders.length === 0) {
          return of([] as ResourceFolderDetails[]);
        }

        const topFolders = folders.slice(0, 3);
        const requests = topFolders.map((f) =>
          this.resourceService.getFolderDetails(f.id).pipe(
            catchError(() => of(null))
          )
        );

        return forkJoin(requests);
      }),
      map((detailsList) =>
        detailsList
          .filter((d): d is ResourceFolderDetails => !!d)
          .flatMap((d) => d.files)
          .slice(0, 5)
      )
    ).subscribe({
      next: (files) => {
        this.filesPreview = files;
        this.loading = false;
      },
      error: () => {
        this.filesPreview = [];
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
}
