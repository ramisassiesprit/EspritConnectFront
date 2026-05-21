import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatService } from '../../../core/services/chat.service';
import { UserService } from '../../../core/services/User.service';
import { Message } from '../../../core/models/message.model';
import { User } from '../../../core/models/user.model';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  
  private chatService = inject(ChatService);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  currentUser: User | null = null;
  receiverId: string | null = null;
  receiver: User | null = null;
  messages: Message[] = [];
  newMessage: string = '';
  contacts: User[] = [];
  private messageSub?: Subscription;

  ngOnInit(): void {
    this.userService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      this.chatService.connect(user.id);
      
      this.loadContacts();
      
      this.route.params.subscribe(params => {
        this.receiverId = params['id'];
        if (this.receiverId) {
          this.loadReceiverInfo();
          this.loadChatHistory();
          
          // Check for auto-send message from navigation state
          const autoSendMsg = history.state.autoSendMsg;
          if (autoSendMsg) {
            // Wait for STOMP to connect before sending
            setTimeout(() => {
              this.newMessage = autoSendMsg;
              this.sendMessage();
              // Clear state to prevent resending on refresh
              history.replaceState({ ...history.state, autoSendMsg: null }, '');
            }, 1000);
          }
        }
      });
    });

    this.messageSub = this.chatService.getMessages().subscribe(msg => {
      if (msg) {
        const isFromReceiver = msg.senderId === this.receiverId && msg.receiverId === this.currentUser?.id;
        const isFromMe = msg.senderId === this.currentUser?.id && msg.receiverId === this.receiverId;
        
        if (isFromReceiver || isFromMe) {
          // Find and replace temporary message or add new one
          const tempIndex = this.messages.findIndex(m => !m.id && m.content === msg.content && m.senderId === msg.senderId);
          if (tempIndex !== -1) {
            this.messages[tempIndex] = msg; // Replace with server-confirmed message (has ID and real timestamp)
          } else {
            const exists = this.messages.some(m => m.id === msg.id);
            if (!exists) {
              this.messages.push(msg);
            }
          }
          this.scrollToBottom();
        }
      }
    });
  }

  loadContacts(): void {
    if (!this.currentUser) return;
    // Fetch only users the current user has conversations with
    this.chatService.getConversations(this.currentUser.id).subscribe(convs => {
      const activeContactIds = new Set(
        convs.map(msg => msg.senderId === this.currentUser!.id ? msg.receiverId : msg.senderId)
      );

      this.userService.getAllUsers().subscribe(users => {
        this.contacts = users.filter(u => activeContactIds.has(u.id));
      });
    });
  }

  loadReceiverInfo(): void {
    if (this.receiverId) {
      this.userService.getUserById(this.receiverId).subscribe(user => {
        this.receiver = user;
        // If navigation requested to start a video call, show placeholder behavior
        const startVideo = (history.state && history.state.startVideo) ? true : false;
        if (startVideo) {
          setTimeout(() => {
            alert('Starting video call with ' + (this.receiver?.firstName || 'user'));
          }, 500);
        }
      });
    }
  }

  loadChatHistory(): void {
    if (this.currentUser && this.receiverId) {
      this.chatService.getChatHistory(this.currentUser.id, this.receiverId)
        .subscribe(history => {
          this.messages = [...history].sort((a, b) => 
            new Date(a.sentAt!).getTime() - new Date(b.sentAt!).getTime()
          );
          this.scrollToBottom();
        });
    }
  }

  sendMessage(): void {
    if (this.newMessage.trim() && this.currentUser && this.receiverId) {
      const msg: Message = {
        senderId: this.currentUser.id,
        receiverId: this.receiverId,
        content: this.newMessage,
        sentAt: new Date().toISOString(),
        senderName: this.currentUser.firstName + ' ' + this.currentUser.lastName
      };
      
      this.chatService.sendMessage(msg);
      // Push temporary message for instant feedback
      this.messages.push(msg);
      this.newMessage = '';
      this.scrollToBottom();
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  getSafeHtml(content: string): SafeHtml {
    if (!content) return '';
    // Bypass Angular's exact sanitization to retain Quill's tags/inline classes 
    // And allow display of lists, bold, etc. 
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  ngOnDestroy(): void {
    this.messageSub?.unsubscribe();
    this.chatService.disconnect();
  }
}
