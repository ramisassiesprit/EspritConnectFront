import { Component, inject, ElementRef, HostListener, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = false;
  private router = inject(Router);
  private aiService = inject(GemAiServiceService);
  private sanitizer = inject(DomSanitizer);

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

  formatMessage(text: string): SafeHtml {
    if (!text) return '';
    
    // Basic Markdown parsing for the chat bubble
    let formattedText = text
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Lists 
      .replace(/^\s*\*\s+(.*)$/gm, '<li>$1</li>');
      
    // Wrap consecutive li elements in a ul
    formattedText = formattedText.replace(/(<li>.*<\/li>(?:\s*<li>.*<\/li>)*)/g, '<ul class="list-disc pl-5 my-2">$1</ul>');

    return this.sanitizer.bypassSecurityTrustHtml(formattedText);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        if (this.scrollContainer) {
          this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
        }
      } catch(err) { }
    }, 50); // slight delay to allow DOM render
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const messageText = this.userInput.trim();
    this.messages.push({ text: messageText, sender: 'user' });
    this.userInput = '';
    this.isLoading = true;
    this.scrollToBottom();

    this.aiService.sendMessage(messageText).subscribe({
      next: (response) => {
        this.messages.push({ 
          text: response.content, 
          sender: 'ai',
          reasoning: response.reasoning,
          isReasoningExpanded: false
        });
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('AI chat error:', err);
        this.messages.push({ text: 'Sorry, I encountered an error connecting to the AI service.', sender: 'ai' });
        this.isLoading = false;
        this.scrollToBottom();
      }
    });
  }
}
