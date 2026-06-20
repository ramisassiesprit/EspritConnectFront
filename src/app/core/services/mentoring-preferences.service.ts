import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MentoringPreferences {
  showOfferHelp: boolean;
  showSeekHelp: boolean;
  showOfferMentoring: boolean;
  showSeekMentoring: boolean;
  offerHelpOptions?: string[];
  seekHelpOptions?: string[];
  offerMentorOptions?: string[];
  seekMentorOptions?: string[];
}

@Injectable({ providedIn: 'root' })
export class MentoringPreferencesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}api/admin/settings/mentoring-preferences`;

  getPreferences(): Observable<MentoringPreferences> {
    return this.http.get<MentoringPreferences>(this.apiUrl);
  }

  savePreferences(prefs: MentoringPreferences): Observable<MentoringPreferences> {
    return this.http.post<MentoringPreferences>(this.apiUrl, prefs);
  }
}
