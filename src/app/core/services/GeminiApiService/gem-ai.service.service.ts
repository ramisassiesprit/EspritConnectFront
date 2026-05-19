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
    // Handling backend returning Server-Sent Events (SSE) stream text
    return this.http.post(this.apiUrl, { prompt: message }, { responseType: 'text' }).pipe(
      map(res => {
        try {
          // If the backend returns pure JSON
          const jsonRes = JSON.parse(res);
          const msgNode = jsonRes?.choices?.[0]?.message;
          return {
            content: msgNode?.content || 'No response content available.',
            reasoning: msgNode?.reasoning_content
          };
        } catch (e) {
          // If the backend returns SSE stream: `data:Hello\n\ndata:!\n\n`
          const content = res
            .split('\n')
            .filter(line => line.startsWith('data:'))
            // The backend does not use a padding space after 'data:', any space is part of the message itself.
            .map(line => line.substring(5))
            .join('');

          return {
            content: content || 'No response content available.',
          };
        }
      })
    );
  }
}
