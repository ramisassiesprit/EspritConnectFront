import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message } from '../models/message.model'; import { Client, Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8086/EspritConnect';
  private readonly apiUrl = `${this.baseUrl}/api/chat`;
  private stompClient: any = null;
  private messageSubject = new BehaviorSubject<Message | null>(null);

  constructor() { }

  connect(userId: string): void {
    const socket = new SockJS(`${this.baseUrl}/ws-chat`);
    this.stompClient = Stomp.over(socket);

    this.stompClient.connectHeaders = {
      userId: userId
    };

    this.stompClient.onConnect = (frame: string) => {
      console.log('Connected: ' + frame);
      this.stompClient?.subscribe(`/user/${userId}/queue/messages`, (message: { body: string; }) => {
        if (message.body) {
          this.messageSubject.next(JSON.parse(message.body));
        }
      });
    };

    this.stompClient.onStompError = (frame: { headers: { [x: string]: string; }; body: string; }) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.stompClient.activate();
  }

  sendMessage(message: Message): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(message)
      });
    }
  }

  getMessages(): Observable<Message | null> {
    return this.messageSubject.asObservable();
  }

  getChatHistory(user1Id: string, user2Id: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/history/${user1Id}/${user2Id}`);
  }

  getConversations(userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/conversations/${userId}`);
  }

  getUnreadMessages(userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/unread/${userId}`);
  }

  markAsRead(messageId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/read/${messageId}`, {});
  }
  deleteMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${messageId}`);
  }
  updateMessage(messageId: string, message: Message): Observable<Message> {
    return this.http.put<Message>(`${this.apiUrl}/${messageId}`, message);
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }
}
