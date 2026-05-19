import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event, EventRegistration } from '../models/event.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly apiUrl = `${environment.apiUrl}events`;
  private http = inject(HttpClient);

  getAllEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.apiUrl);
  }

  getEventById(id: string): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`);
  }

  createEvent(event: Event): Observable<Event> {
    return this.http.post<Event>(this.apiUrl, event);
  }

  updateEvent(id: string, event: Event): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/${id}`, event);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  registerToEvent(id: string): Observable<EventRegistration> {
    return this.http.post<EventRegistration>(`${this.apiUrl}/${id}/register`, {});
  }

  unregisterFromEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/unregister`);
  }

  getEventRegistrations(id: string): Observable<EventRegistration[]> {
    return this.http.get<EventRegistration[]>(`${this.apiUrl}/${id}/registrations`);
  }

  getUserEvents(userId: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/user/${userId}/registered`);
  }

  approveEvent(id: string): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectEvent(id: string): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/${id}/reject`, {});
  }

  getRecommendedEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/recommended`);
  }

  checkIn(id: string, userId: string): Observable<EventRegistration> {
    return this.http.post<EventRegistration>(`${this.apiUrl}/${id}/registrations/${userId}/check-in`, {});
  }

  checkInByRegistrationId(registrationId: string): Observable<EventRegistration> {
    return this.http.post<EventRegistration>(`${this.apiUrl}/registrations/${registrationId}/check-in`, {});
  }

  submitFeedback(id: string, rating: number, comment?: string): Observable<EventRegistration> {
    const params: any = { rating };
    if (comment) params.comment = comment;
    return this.http.post<EventRegistration>(`${this.apiUrl}/${id}/feedback`, {}, { params });
  }

  getFeedbacks(id: string): Observable<EventRegistration[]> {
    return this.http.get<EventRegistration[]>(`${this.apiUrl}/${id}/feedbacks`);
  }

  declareWinner(id: string, userId: string, rank?: number): Observable<EventRegistration> {
    const params: any = {};
    if (rank !== undefined) params.rank = rank;
    return this.http.post<EventRegistration>(`${this.apiUrl}/${id}/registrations/${userId}/winner`, {}, { params });
  }

  getWinners(id: string): Observable<EventRegistration[]> {
    return this.http.get<EventRegistration[]>(`${this.apiUrl}/${id}/winners`);
  }
}
