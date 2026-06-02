import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RecommendationResult {
  jobs: any[];
  events: any[];
  groups: any[];
  mentors: any[];
}

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private readonly apiUrl = `${environment.apiUrl}recommendations`;
  private http = inject(HttpClient);

  getUserRecommendations(): Observable<RecommendationResult> {
    return this.http.get<RecommendationResult>(`${this.apiUrl}/user`);
  }

  getJobCandidates(jobId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/job/${jobId}/candidates`);
  }

  getCompanyRecommendations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/company`);
  }
}
