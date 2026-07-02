import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MailingSettings {
  authEmailsEnabled: boolean;
  eventEmailsEnabled: boolean;
  mentoringEmailsEnabled: boolean;
  videoChatEmailsEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MailingSettingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}api/admin/settings/mailing`;

  getSettings(): Observable<MailingSettings> {
    return this.http.get<MailingSettings>(this.apiUrl);
  }

  saveSettings(settings: MailingSettings): Observable<MailingSettings> {
    return this.http.post<MailingSettings>(this.apiUrl, settings);
  }
}
