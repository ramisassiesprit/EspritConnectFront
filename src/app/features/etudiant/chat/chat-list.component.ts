import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { UserService } from '../../../core/services/User.service';
import { Message } from '../../../core/models/message.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.css'
})
export class ChatListComponent implements OnInit {
  private chatService = inject(ChatService);
  private userService = inject(UserService);

  currentUser: User | null = null;
  conversations: Message[] = [];

  ngOnInit(): void {
    this.userService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      this.loadConversations();
    });
  }

  loadConversations(): void {
    if (this.currentUser) {
      this.chatService.getConversations(this.currentUser.id).subscribe(convs => {
        this.conversations = convs;
      });
    }
  }
}
