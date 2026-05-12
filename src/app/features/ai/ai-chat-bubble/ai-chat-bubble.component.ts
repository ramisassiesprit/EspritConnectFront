import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ai-chat-bubble',
  imports: [],
  templateUrl: './ai-chat-bubble.component.html',
  styleUrl: './ai-chat-bubble.component.css',
})
export class AiChatBubbleComponent {
  isOpen = false;
  private router = inject(Router);

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  expandToPage() {
    this.isOpen = false;
    this.router.navigate(['/ai-chat']);
  }
}
