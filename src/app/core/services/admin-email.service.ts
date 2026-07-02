import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EmailHistory {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  messageBody: string;
  emailType: string;
  sentAt: string;
  status: string;
  errorMessage: string;
  sentBy: string;
  hasImage: boolean;
}

export interface EmailStats {
  totalSent: number;
  successful: number;
  failed: number;
  uniqueRecipients: number;
  sentToday: number;
  sentThisMonth: number;
  byType: Record<string, number>;
}

export interface BirthdaySettings {
  enabled: boolean;
  template: string;
}

export interface UpcomingBirthday {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  isToday: boolean;
  daysUntilBirthday: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminEmailService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}api/admin/email`;

  getHistory(): Observable<EmailHistory[]> {
    return this.http.get<EmailHistory[]>(`${this.apiUrl}/history`);
  }

  getStats(): Observable<EmailStats> {
    return this.http.get<EmailStats>(`${this.apiUrl}/stats`);
  }

  getBirthdaySettings(): Observable<BirthdaySettings> {
    return this.http.get<BirthdaySettings>(`${this.apiUrl}/settings/birthday`);
  }

  updateBirthdaySettings(settings: Partial<BirthdaySettings>): Observable<BirthdaySettings> {
    return this.http.put<BirthdaySettings>(`${this.apiUrl}/settings/birthday`, settings);
  }

  getUpcomingBirthdays(): Observable<UpcomingBirthday[]> {
    return this.http.get<UpcomingBirthday[]>(`${this.apiUrl}/birthdays/upcoming`);
  }

  sendBirthdayEmailsToday(): Observable<{ sent: number }> {
    return this.http.post<{ sent: number }>(`${this.apiUrl}/birthdays/send-today`, {});
  }
}
