import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MentorshipService, MentoringRequest, MentoringStatus } from '../../../../core/services/mentorship.service';
import { UserService } from '../../../../core/services/User.service';

@Component({
  selector: 'app-mentor-relations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mentor-relations.component.html',
  styleUrl: './mentor-relations.component.css'
})
export class MentorRelationsComponent implements OnInit {
  activeTab: 'current' | 'declined' | 'canceled' | 'past' = 'current';
  isLoading = true;
  currentUserId: string | null = null;
  requests: MentoringRequest[] = [];

  private mentorshipService = inject(MentorshipService);
  private userService = inject(UserService);
  private router = inject(Router);

  ngOnInit(): void {
    this.userService.getCurrentUser().pipe(
      map(user => user.id),
      catchError(() => of(null))
    ).subscribe(userId => {
      this.currentUserId = userId;
      this.loadRequests();
    });
  }

  loadRequests(): void {
    this.isLoading = true;

    forkJoin({
      received: this.mentorshipService.getReceivedRequests().pipe(catchError(() => of([]))),
      sent: this.mentorshipService.getSentRequests().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ received, sent }) => {
        const merged = [...received, ...sent].reduce((acc: MentoringRequest[], request) => {
          if (!acc.some(item => item.id === request.id)) {
            acc.push(request);
          }
          return acc;
        }, []);

        this.requests = merged.sort((left, right) => {
          const leftDate = new Date(left.requestedAt || 0).getTime();
          const rightDate = new Date(right.requestedAt || 0).getTime();
          return rightDate - leftDate;
        });
        this.isLoading = false;
      },
      error: () => {
        this.requests = [];
        this.isLoading = false;
      }
    });
  }

  setTab(tab: 'current' | 'declined' | 'canceled' | 'past'): void {
    this.activeTab = tab;
  }

  getTabRequests(tab: 'current' | 'declined' | 'canceled' | 'past'): MentoringRequest[] {
    return this.requests.filter(request => {
      if (tab === 'current') {
        return request.status === 'PENDING' || request.status === 'ACCEPTED';
      }

      if (tab === 'declined') {
        return request.status === 'REJECTED';
      }

      if (tab === 'canceled') {
        return request.status === 'CANCELLED';
      }

      return request.status === 'COMPLETED';
    });
  }

  isIncomingRequest(request: MentoringRequest): boolean {
    return !!this.currentUserId && request.mentor.id === this.currentUserId;
  }

  getDisplayName(request: MentoringRequest): string {
    const participant = this.isIncomingRequest(request) ? request.mentee : request.mentor;
    return `${participant.firstName} ${participant.lastName}`;
  }

  canRespond(request: MentoringRequest): boolean {
    return request.status === 'PENDING' && this.isIncomingRequest(request);
  }

  canEnd(request: MentoringRequest): boolean {
    return request.status === 'ACCEPTED' && (!!this.currentUserId && (request.mentor.id === this.currentUserId || request.mentee.id === this.currentUserId));
  }

  respond(request: MentoringRequest, status: Extract<MentoringStatus, 'ACCEPTED' | 'REJECTED' | 'COMPLETED'>): void {
    this.mentorshipService.updateRequestStatus(request.id, status).subscribe({
      next: () => this.loadRequests(),
      error: (error) => console.error('Failed to update mentoring request', error)
    });
  }

  endMentorship(request: MentoringRequest): void {
    if (!this.canEnd(request)) return;
    this.respond(request, 'COMPLETED');
  }

  getOtherUserId(request: MentoringRequest): string {
    if (!this.currentUserId) return request.mentor.id;
    return request.mentor.id === this.currentUserId ? request.mentee.id : request.mentor.id;
  }

  openChat(request: MentoringRequest): void {
    const otherId = this.getOtherUserId(request);
    this.router.navigate(['/etudiant/chat', otherId]);
  }

  startCall(request: MentoringRequest): void {
    const otherId = this.getOtherUserId(request);
    // Navigate to chat with a flag to start video (Chat component shows a placeholder for now)
    this.router.navigate(['/etudiant/chat', otherId], { state: { startVideo: true } });
  }
}
