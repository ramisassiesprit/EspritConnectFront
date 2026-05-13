import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Badge } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class BadgeService {
  private readonly apiUrl = `${environment.apiUrl}api/badges`;
  private http = inject(HttpClient);

  getUserBadges(userId: string): Observable<Badge[]> {
    return this.http.get<Badge[]>(`${this.apiUrl}/user/${userId}`);
  }
}
