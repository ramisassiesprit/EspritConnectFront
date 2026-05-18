import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateResourceFolderRequest, ResourceFile, ResourceFolder, ResourceFolderDetails } from '../models/resource.model';

@Injectable({ providedIn: 'root' })
export class ResourceService {
  private readonly baseUrl = `${environment.apiUrl}resources`;

  constructor(private readonly http: HttpClient) {}

  getFolders(): Observable<ResourceFolder[]> {
    return this.http.get<ResourceFolder[]>(this.baseUrl);
  }

  getFolderDetails(folderId: string): Observable<ResourceFolderDetails> {
    return this.http.get<ResourceFolderDetails>(`${this.baseUrl}/${folderId}`);
  }

  createFolder(payload: CreateResourceFolderRequest): Observable<ResourceFolder> {
    return this.http.post<ResourceFolder>(`${this.baseUrl}/folders`, payload);
  }

  updateFolder(folderId: string, payload: CreateResourceFolderRequest): Observable<ResourceFolder> {
    return this.http.put<ResourceFolder>(`${this.baseUrl}/folders/${folderId}`, payload);
  }

  uploadFolderCover(folderId: string, file: File): Observable<ResourceFolder> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ResourceFolder>(`${this.baseUrl}/folders/${folderId}/cover`, formData);
  }

  uploadFile(folderId: string, file: File): Observable<ResourceFile> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ResourceFile>(`${this.baseUrl}/folders/${folderId}/files`, formData);
  }

  deleteFolder(folderId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/folders/${folderId}`);
  }

  deleteFile(fileId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/files/${fileId}`);
  }

  downloadFile(downloadUrl: string): Observable<HttpResponse<Blob>> {
    const absoluteUrl = this.toAbsoluteApiUrl(downloadUrl);
    return this.http.get(absoluteUrl, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  private toAbsoluteApiUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const base = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;

    if (url.startsWith('/EspritConnect')) {
      return `${window.location.protocol}//${window.location.hostname}:8086${url}`;
    }

    if (url.startsWith('/')) {
      return `${base}${url}`;
    }

    return `${base}/${url}`;
  }
}
