import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReactionService {
  private readonly apiUrl = `${environment.apiUrl}api/reactions`;
  private http = inject(HttpClient);

  likePost(postId: string, reactionType: string = 'LIKE'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${encodeURIComponent(postId)}?reactionType=${encodeURIComponent(reactionType)}`, {});
  }

  unlikePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(postId)}`);
  }
}
