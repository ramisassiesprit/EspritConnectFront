import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GemAiServiceService } from '../../../core/services/GeminiApiService/gem-ai.service.service';

export interface ChatMessage {
  text: string;
  sender: 'user' | 'ai';
  reasoning?: string;
  isReasoningExpanded?: boolean;
}

@Component({
  selector: 'app-ai-chat-bubble',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './ai-chat-bubble.component.html',
  styleUrl: './ai-chat-bubble.component.css',
})
export class AiChatBubbleComponent {
  isOpen = false;
  private router = inject(Router);
  private aiService = inject(GemAiServiceService);

  userInput = '';
  isLoading = false;
  messages: ChatMessage[] = [
    { text: "Hi there! 👋 I'm your Esprit Connect AI assistant. How can I help you navigate the alumni network today?", sender: 'ai' }
  ];

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  expandToPage() {
    this.isOpen = false;
    this.router.navigate(['/ai-chat']);
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const messageText = this.userInput.trim();
    this.messages.push({ text: messageText, sender: 'user' });
    this.userInput = '';
    this.isLoading = true;

    this.aiService.sendMessage(messageText).subscribe({
      next: (response) => {
        this.messages.push({ 
          text: response.content, 
          sender: 'ai',
          reasoning: response.reasoning,
          isReasoningExpanded: false
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('AI chat error:', err);
        this.messages.push({ text: 'Sorry, I encountered an error connecting to the AI service.', sender: 'ai' });
        this.isLoading = false;
      }
    });
  }
}
