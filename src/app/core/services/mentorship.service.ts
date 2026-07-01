import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EspritProfile, User } from '../models/user.model';

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

export interface TopMentor {
  firstName: string;
  lastName: string;
  completedSessions: number;
  acceptedRequests: number;
  totalReceived: number;
  acceptanceRate: number;
  avgRating: number | null;
}

export interface SessionFeedback {
  mentorName: string;
  menteeName: string;
  rating: number | null;
  feedback: string;
  sessionDate: string;
}

export interface MentoringStats {
  totalUsers: number;
  totalMentors: number;
  usersOfferingHelp: number;
  usersSeekingHelp: number;
  usersOfferingMentoring: number;
  usersSeekingMentoring: number;
  offerHelpPercentage: number;
  seekHelpPercentage: number;
  offerMentoringPercentage: number;
  seekMentoringPercentage: number;
  offerHelpByOption: Record<string, number>;
  seekHelpByOption: Record<string, number>;
  offerMentoringByOption: Record<string, number>;
  seekMentoringByOption: Record<string, number>;
  totalRequests: number;
  pendingRequests: number;
  acceptedRequests: number;
  rejectedRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  requestsByStatus: Record<string, number>;
  requestsByMonth: Record<string, number>;
  requestsByFieldOfStudy: Record<string, number>;
  totalSessions: number;
  averageSessionRating: number | null;
  topMentors: TopMentor[];
  ratingDistribution: Record<string, number>;
  recentFeedback: SessionFeedback[];
  requestsByGraduationYear: Record<string, number>;
  requestsByIndustry: Record<string, number>;
  supplyVsDemandByOption: Record<string, [number, number]>;
}

export interface MentorMatch {
  user: User;
  espritProfile?: EspritProfile;
  matchPercentage: number;
  matchedSignals?: string[];
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

  getRecommendedMentors(userId: string): Observable<MentorMatch[]> {
    return this.http.get<MentorMatch[]>(`${this.apiUrl}/recommendations`, {
      params: { userId }
    });
  }

  getStats(): Observable<MentoringStats> {
    return this.http.get<MentoringStats>(`${this.apiUrl}/stats`);
  }
}