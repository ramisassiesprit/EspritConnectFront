import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { Group, GroupCreateRequest } from '../models/group.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly apiUrl = `${environment.apiUrl}groups`;
  private http = inject(HttpClient);

  private membershipChanged = new Subject<void>();
  membershipChanged$ = this.membershipChanged.asObservable();

  getAllGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.apiUrl);
  }

  getGroupById(groupId: string): Observable<Group> {
    return this.http.get<Group>(`${this.apiUrl}/${encodeURIComponent(groupId)}`);
  }

  getUserGroups(userId: string): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.apiUrl}/user/${encodeURIComponent(userId)}`);
  }

  createGroup(payload: GroupCreateRequest): Observable<Group> {
    return this.http.post<Group>(this.apiUrl, payload);
  }

  createGroupWithFiles(payload: GroupCreateRequest, logoFile?: File, bannerFile?: File): Observable<Group> {
    const formData = new FormData();

    // Add group data as a JSON blob with explicit application/json type
    // This allows Spring's @RequestPart to automatically deserialize it
    const groupBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    formData.append('group', groupBlob);

    // Add files
    if (logoFile) {
      formData.append('logoFile', logoFile);
    }
    if (bannerFile) {
      formData.append('bannerFile', bannerFile);
    }

    console.log('Sending group creation request with payload:', payload);
    return this.http.post<Group>(`${this.apiUrl}/with-files`, formData);
  }

  joinGroup(groupId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${encodeURIComponent(groupId)}/join`, null)
      .pipe(tap(() => this.membershipChanged.next()));
  }

  exitGroup(groupId: string, userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${encodeURIComponent(groupId)}/leave`, { userId })
      .pipe(tap(() => this.membershipChanged.next()));
  }

  getPendingGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.apiUrl}/pending`);
  }

  approveGroup(groupId: string): Observable<Group> {
    return this.http.post<Group>(`${this.apiUrl}/${encodeURIComponent(groupId)}/approve`, {});
  }

  rejectGroup(groupId: string): Observable<Group> {
    return this.http.post<Group>(`${this.apiUrl}/${encodeURIComponent(groupId)}/reject`, {});
  }

  setGroupStatus(groupId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED'): Observable<Group> {
    return this.http.post<Group>(`${this.apiUrl}/${encodeURIComponent(groupId)}/status`, null, {
      params: { status }
    });
  }

  updateGroup(groupId: string, payload: GroupCreateRequest, logoFile?: File, bannerFile?: File): Observable<Group> {
    // Always send multipart form-data to the backend update endpoint.
    // This avoids issues with multipart+PUT and keeps server handling consistent.
    const formData = new FormData();
    const groupBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    formData.append('group', groupBlob);
    if (logoFile) formData.append('logoFile', logoFile);
    if (bannerFile) formData.append('bannerFile', bannerFile);
    return this.http.post<Group>(`${this.apiUrl}/${encodeURIComponent(groupId)}/with-files`, formData);
  }

  deleteGroup(groupId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(groupId)}`);
  }

  getGroupMembers(groupId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${encodeURIComponent(groupId)}/members`);
  }

  addMember(groupId: string, userId: string, role: string = 'MEMBER'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${encodeURIComponent(groupId)}/members`, null, {
      params: {
        userId: userId,
        role: role
      }
    });
  }

  removeMember(groupId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`)
      .pipe(tap(() => this.membershipChanged.next()));
  }

  approveMember(groupId: string, userId: string) {
    return this.http.post<any>(`${this.apiUrl}/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}/approve`, {})
      .pipe(tap(() => this.membershipChanged.next()));
  }

  rejectMember(groupId: string, userId: string) {
    return this.http.post<void>(`${this.apiUrl}/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}/reject`, {})
      .pipe(tap(() => this.membershipChanged.next()));
  }

  // --- Shared Photo Albums signal ---
  private groupPhotosSignal = signal<string[]>([]);
  groupPhotos = this.groupPhotosSignal.asReadonly();

  setPhotos(urls: string[]) {
    this.groupPhotosSignal.set(urls);
  }

  addPhotos(urls: string[]) {
    this.groupPhotosSignal.update((existing: string[]) => [...new Set([...urls, ...existing])]);
  }

  clearPhotos() {
    this.groupPhotosSignal.set([]);
  }
}
