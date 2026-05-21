import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Notification } from '../models/notification.model';
import { environment } from '../../../environments/environment';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}notifications`;
  private http = inject(HttpClient);
  private readonly socketUrl = `${environment.apiUrl.replace(/\/$/, '')}/ws-chat`;
  private stompClient: any = null;
  private liveNotificationSubject = new Subject<Notification>();

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl);
  }

  markAsRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/read-all`, {});
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`);
  }

  connectToNotifications(userId: string): void {
    if (this.stompClient && this.stompClient.connected) {
      return;
    }

    const socket = new SockJS(this.socketUrl);
    this.stompClient = Stomp.over(socket);
    this.stompClient.debug = () => {};
    this.stompClient.connectHeaders = { userId };

    this.stompClient.onConnect = () => {
      this.stompClient?.subscribe(`/user/${userId}/queue/notifications`, (message: { body: string }) => {
        if (!message.body) {
          return;
        }

        this.liveNotificationSubject.next(JSON.parse(message.body));
      });
    };

    this.stompClient.onStompError = (frame: { headers: { [key: string]: string }; body: string }) => {
      console.error('Notification websocket error:', frame.headers['message'], frame.body);
    };

    this.stompClient.activate();
  }

  getLiveNotifications(): Observable<Notification> {
    return this.liveNotificationSubject.asObservable();
  }

  disconnectNotifications(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }
}
