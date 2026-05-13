import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Group, GroupCreateRequest } from '../models/group.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly apiUrl = `${environment.apiUrl}groups`;
  private http = inject(HttpClient);

  getAllGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.apiUrl);
  }

  getUserGroups(userId: string): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.apiUrl}/user/${encodeURIComponent(userId)}`);
  }

  createGroup(payload: GroupCreateRequest): Observable<Group> {
    return this.http.post<Group>(this.apiUrl, payload);
  }
}
