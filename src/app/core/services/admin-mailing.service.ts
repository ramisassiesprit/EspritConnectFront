import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminMailRequest {
  emails: string[];
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminMailingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}admin/mailing`;

  sendAdminMail(request: AdminMailRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/send`, request);
  }
}
