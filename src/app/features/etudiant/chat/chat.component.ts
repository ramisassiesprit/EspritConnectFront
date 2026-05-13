import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';
import { UserService } from '../../../core/services/User.service';
import { Message } from '../../../core/models/message.model';
import { User } from '../../../core/models/user.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);

  currentUser: User | null = null;
  receiverId: string | null = null;
  receiver: User | null = null;
  messages: Message[] = [];
  newMessage: string = '';

  ngOnInit(): void {
    this.userService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      this.chatService.connect(user.id);
      
      this.route.params.subscribe(params => {
        this.receiverId = params['id'];
        if (this.receiverId) {
          this.loadChatHistory();
          // Ideally fetch receiver info too
        }
      });
    });

    this.chatService.getMessages().subscribe(msg => {
      if (msg && (msg.senderId === this.receiverId || msg.receiverId === this.receiverId)) {
        this.messages.push(msg);
      }
    });
  }

  loadChatHistory(): void {
    if (this.currentUser && this.receiverId) {
      this.chatService.getChatHistory(this.currentUser.id, this.receiverId)
        .subscribe(history => this.messages = history);
    }
  }

  sendMessage(): void {
    if (this.newMessage.trim() && this.currentUser && this.receiverId) {
      const msg: Message = {
        senderId: this.currentUser.id,
        receiverId: this.receiverId,
        content: this.newMessage
      };
      this.chatService.sendMessage(msg);
      this.messages.push({ ...msg, sentAt: new Date().toISOString(), senderName: 'Me' });
      this.newMessage = '';
    }
  }

  ngOnDestroy(): void {
    this.chatService.disconnect();
  }
}
