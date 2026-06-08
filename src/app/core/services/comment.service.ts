import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommentDTO } from '../models/post.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private readonly apiUrl = `${environment.apiUrl}api/comments`;
  private http = inject(HttpClient);

  getCommentsByPost(postId: string): Observable<CommentDTO[]> {
    return this.http.get<CommentDTO[]>(`${this.apiUrl}/post/${encodeURIComponent(postId)}`);
  }

  addComment(postId: string, content: string, parentId?: string): Observable<CommentDTO> {
    let params = `?postId=${encodeURIComponent(postId)}&content=${encodeURIComponent(content)}`;
    if (parentId) {
      params += `&parentId=${encodeURIComponent(parentId)}`;
    }
    return this.http.post<CommentDTO>(`${this.apiUrl}${params}`, {});
  }

  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(commentId)}`);
  }
  updateComment(commentId: string, content: string): Observable<CommentDTO> {
  const url = `${this.apiUrl}/${encodeURIComponent(commentId)}`;
  const body = { content: content.trim() };
  
  return this.http.put<CommentDTO>(url, body);
}

}
