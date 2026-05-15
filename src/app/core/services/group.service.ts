import { Injectable, inject } from '@angular/core';
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

  joinGroup(groupId: string, userId: string): Observable<Group> {
    return this.http.post<Group>(`${this.apiUrl}/${encodeURIComponent(groupId)}/join`, { userId })
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

  updateGroup(groupId: string, payload: GroupCreateRequest, logoFile?: File, bannerFile?: File): Observable<Group> {
    const formData = new FormData();
    const groupBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    formData.append('group', groupBlob);

    if (logoFile) formData.append('logoFile', logoFile);
    if (bannerFile) formData.append('bannerFile', bannerFile);

    return this.http.put<Group>(`${this.apiUrl}/${encodeURIComponent(groupId)}`, formData);
  }

  deleteGroup(groupId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(groupId)}`);
  }
}
