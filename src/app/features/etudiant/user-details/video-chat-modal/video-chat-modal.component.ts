import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../core/models/user.model';
import { VideoChatService } from '../../../../core/services/video-chat.service';

@Component({
  selector: 'app-video-chat-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-chat-modal.html',
  styleUrls: ['./video-chat-modal.css']
})
export class VideoChatModalComponent {
  @Input() isOpen = false;
  @Input() user?: User;
  @Output() close = new EventEmitter<void>();
  @Output() scheduled = new EventEmitter<any>();

  topic = '';
  message = '';
  date = '';

  isSending = false;
  successMessage?: string;

  constructor(private videoChatService: VideoChatService) {}

  closeModal() {
    this.close.emit();
    this.resetForm();
  }

  resetForm() {
    this.topic = '';
    this.message = '';
    this.date = '';
    this.successMessage = undefined;
    this.isSending = false;
  }

  scheduleMeeting() {
    if (!this.topic || !this.date || !this.user) return;

    this.isSending = true;
    this.videoChatService.scheduleVideoChat({
      receiverId: this.user.id,
      topic: this.topic,
      message: this.message,
      date: this.date
    }).subscribe({
      next: (res) => {
        this.isSending = false;
        this.successMessage = 'Meeting scheduled successfully! An email and notification have been sent.';
        setTimeout(() => {
          this.scheduled.emit(res);
          this.closeModal();
        }, 2000);
      },
      error: (err) => {
        this.isSending = false;
        alert('Failed to schedule meeting: ' + (err.error?.message || err.message));
      }
    });
  }
}
