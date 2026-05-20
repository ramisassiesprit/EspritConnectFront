import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { TicketPost, TicketComment } from '../models/ticket.model';
import { environment } from '../../../environments/environment';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
  private readonly apiUrl = `${this.baseUrl}/api/tickets`;

  private stompClient: any = null;

  // Real-time subjects
  private newPostSubject = new Subject<TicketPost>();
  private commentsSubject = new Subject<TicketComment>();
  private statusSubject = new Subject<TicketPost>();
  private upvoteSubject = new Subject<TicketPost>();
  private typingSubject = new Subject<{ postId: string; username: string }>();

  // REST calls
  getPosts(category?: string, status?: string, search?: string): Observable<TicketPost[]> {
    let params: any = {};
    if (category) params.category = category;
    if (status) params.status = status;
    if (search) params.search = search;
    return this.http.get<TicketPost[]>(this.apiUrl, { params });
  }

  getPostById(id: string): Observable<TicketPost> {
    return this.http.get<TicketPost>(`${this.apiUrl}/${id}`);
  }

  createPost(title: string, content: string, category: string): Observable<TicketPost> {
    return this.http.post<TicketPost>(this.apiUrl, { title, content, category });
  }

  addComment(postId: string, content: string): Observable<TicketComment> {
    return this.http.post<TicketComment>(`${this.apiUrl}/${postId}/comments`, { content });
  }

  upvotePost(postId: string): Observable<TicketPost> {
    return this.http.post<TicketPost>(`${this.apiUrl}/${postId}/like`, {});
  }

  upvoteComment(commentId: string): Observable<TicketComment> {
    return this.http.post<TicketComment>(`${this.apiUrl}/comments/${commentId}/like`, {});
  }

  markCommentAsSolution(commentId: string): Observable<TicketComment> {
    return this.http.put<TicketComment>(`${this.apiUrl}/comments/${commentId}/solution`, {});
  }

  togglePostStatus(postId: string, status: string): Observable<TicketPost> {
    return this.http.put<TicketPost>(`${this.apiUrl}/${postId}/status`, {}, { params: { status } });
  }

  // ── WebSocket Channels ───────────────────────────────────────────────────

  connect(userId: string): void {
    if (this.stompClient && this.stompClient.connected) return;

    const socket = new SockJS(`${this.baseUrl}/ws-chat`);
    this.stompClient = Stomp.over(socket);

    this.stompClient.connectHeaders = { userId };

    this.stompClient.onConnect = (frame: string) => {
      console.log('STOMP connected to SOS Forum: ' + frame);

      // Subscribe to global new posts topic
      this.stompClient.subscribe('/topic/qa.newPost', (message: any) => {
        if (message.body) {
          this.newPostSubject.next(JSON.parse(message.body));
        }
      });
    };

    this.stompClient.onStompError = (frame: any) => {
      console.error('Broker Q&A error: ' + frame.headers['message']);
    };

    this.stompClient.activate();
  }

  // Subscribe to specific Q&A post details in real-time
  subscribeToPost(postId: string): void {
    if (!this.stompClient || !this.stompClient.connected) return;

    // Subscribe to comments
    this.stompClient.subscribe(`/topic/qa.comments.${postId}`, (message: any) => {
      if (message.body) {
        this.commentsSubject.next(JSON.parse(message.body));
      }
    });

    // Subscribe to status updates
    this.stompClient.subscribe(`/topic/qa.status.${postId}`, (message: any) => {
      if (message.body) {
        this.statusSubject.next(JSON.parse(message.body));
      }
    });

    // Subscribe to upvote changes
    this.stompClient.subscribe(`/topic/qa.upvote.${postId}`, (message: any) => {
      if (message.body) {
        this.upvoteSubject.next(JSON.parse(message.body));
      }
    });

    // Subscribe to typing indicator
    this.stompClient.subscribe(`/topic/qa.typing.${postId}`, (message: any) => {
      if (message.body) {
        this.typingSubject.next({ postId, username: message.body });
      }
    });
  }

  // Publish typing indicator
  sendTyping(postId: string, username: string): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: `/app/qa.typing/${postId}`,
        body: username
      });
    }
  }

  // Getters for real-time streams
  onNewPost(): Observable<TicketPost> {
    return this.newPostSubject.asObservable();
  }

  onNewComment(): Observable<TicketComment> {
    return this.commentsSubject.asObservable();
  }

  onStatusUpdate(): Observable<TicketPost> {
    return this.statusSubject.asObservable();
  }

  onUpvoteUpdate(): Observable<TicketPost> {
    return this.upvoteSubject.asObservable();
  }

  onTypingUpdate(): Observable<{ postId: string; username: string }> {
    return this.typingSubject.asObservable();
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }
}
