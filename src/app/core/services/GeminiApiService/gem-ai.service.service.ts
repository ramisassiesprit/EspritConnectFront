import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AiChatResponse {
  content: string;
  reasoning?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GemAiServiceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}api/ai/chat`;

  constructor() { }

  sendMessage(message: string): Observable<AiChatResponse> {
    // Sending a POST request and extracting the content and reasoning from the choices array
    return this.http.post<any>(this.apiUrl, { prompt: message }).pipe(
      map(res => {
        const msgNode = res?.choices?.[0]?.message;
        return {
          content: msgNode?.content || 'No response content available.',
          reasoning: msgNode?.reasoning_content
        };
      })
    );
  }
}
