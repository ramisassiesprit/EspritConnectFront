import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PostDTO } from '../models/post.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private readonly apiUrl = `${environment.apiUrl}api/posts`;
  private http = inject(HttpClient);

  getFeedPosts(): Observable<PostDTO[]> {
    return this.http.get<PostDTO[]>(this.apiUrl);
  }

  createPost(content: string, files?: File[], mediaUrl?: string, postType?: string): Observable<PostDTO> {
    const formData = new FormData();
    formData.append('content', content);
    if (mediaUrl) {
      formData.append('mediaUrl', mediaUrl);
    }
    if (postType) {
      formData.append('postType', postType);
    }
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }
    return this.http.post<PostDTO>(this.apiUrl, formData);
  }

  getGroupPosts(groupId: string): Observable<PostDTO[]> {
    return this.http.get<PostDTO[]>(`${this.apiUrl}/group/${encodeURIComponent(groupId)}`);
  }

  createGroupPost(content: string, groupId: string, files: File[], mediaUrl?: string): Observable<PostDTO> {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('groupId', groupId);
    if (mediaUrl) {
      formData.append('mediaUrl', mediaUrl);
    }
    
    // Add all uploaded media & attached files
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }

    return this.http.post<PostDTO>(this.apiUrl, formData);
  }

  updatePost(postId: string, content: string, mediaUrl?: string): Observable<PostDTO> {
    let params = `?content=${encodeURIComponent(content)}`;
    if (mediaUrl) {
      params += `&mediaUrl=${encodeURIComponent(mediaUrl)}`;
    } else {
      params += `&mediaUrl=`;
    }
    return this.http.put<PostDTO>(`${this.apiUrl}/${encodeURIComponent(postId)}${params}`, {});
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(postId)}`);
  }
}
