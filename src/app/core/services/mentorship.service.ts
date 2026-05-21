import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

export type MentoringStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export interface MentoringRequest {
  id: string;
  mentee: User;
  mentor: User;
  message?: string;
  status: MentoringStatus;
  requestedAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MentorshipService {
  private readonly apiUrl = `${environment.apiUrl}mentorship`;
  private http = inject(HttpClient);

  getReceivedRequests(): Observable<MentoringRequest[]> {
    return this.http.get<MentoringRequest[]>(`${this.apiUrl}/requests/received`);
  }

  getSentRequests(): Observable<MentoringRequest[]> {
    return this.http.get<MentoringRequest[]>(`${this.apiUrl}/requests/sent`);
  }

  createRequest(mentorId: string, message?: string): Observable<MentoringRequest> {
    const body: any = { mentor: { id: mentorId } };
    if (message) body.message = message;
    return this.http.post<MentoringRequest>(`${this.apiUrl}/requests`, body);
  }

  createOffer(menteeId: string, message?: string): Observable<MentoringRequest> {
    const body: any = { mentee: { id: menteeId } };
    if (message) body.message = message;
    return this.http.post<MentoringRequest>(`${this.apiUrl}/offers`, body);
  }

  updateRequestStatus(requestId: string, status: MentoringStatus): Observable<MentoringRequest> {
    return this.http.put<MentoringRequest>(`${this.apiUrl}/requests/${requestId}/status`, null, {
      params: { status }
    });
  }
}