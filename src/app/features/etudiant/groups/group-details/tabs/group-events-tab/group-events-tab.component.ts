import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EventService } from '../../../../../../core/services/event.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { GroupService } from '../../../../../../core/services/group.service';
import { Event, EventType, EventStatus } from '../../../../../../core/models/event.model';

@Component({
  selector: 'app-group-events-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="section-card events-card">
      <div class="events-header">
        <div>
          <h3>Events</h3>
          <span class="events-count">{{ events.length }} event{{ events.length !== 1 ? 's' : '' }}</span>
        </div>
        <button *ngIf="isOwner" class="btn-create-event" (click)="openCreateModal()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Create Event
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="empty-events-state">
        <div class="spinner"></div>
        <p>Loading events...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && events.length === 0" class="empty-events-state">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        <h4>No events yet</h4>
        <p *ngIf="isOwner">Create the first event for this group!</p>
        <p *ngIf="!isOwner">No events have been created for this group yet.</p>
      </div>

      <!-- Events List -->
      <div *ngIf="events.length > 0" class="events-list">
        <div *ngFor="let event of events" class="event-card" (click)="viewEvent(event)">
          <div class="event-date-badge">
            <span class="event-date-month">{{ getMonth(event.startAt) }}</span>
            <span class="event-date-day">{{ getDay(event.startAt) }}</span>
          </div>
          <div class="event-info">
            <h4 class="event-title">{{ event.title }}</h4>
            <div class="event-meta">
              <span class="event-meta-item">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {{ formatDate(event.startAt) }}{{ event.endAt ? ' - ' + formatDate(event.endAt) : '' }}
              </span>
              <span *ngIf="event.location" class="event-meta-item">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {{ event.location }}
              </span>
              <span *ngIf="event.eventType" class="event-type-badge" [ngClass]="'type-' + event.eventType.toLowerCase()">
                {{ getEventTypeLabel(event.eventType) }}
              </span>
              <span class="event-status-badge" [ngClass]="'status-' + (event.status || 'PENDING').toLowerCase()">
                {{ getEventStatusLabel(event.status) }}
              </span>
            </div>
          </div>
          <div class="event-registrations">
            <span class="reg-count">{{ event.registeredCount || 0 }}</span>
            <span class="reg-label">registered</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Event Modal -->
    <div *ngIf="showCreateModal" class="modal-overlay" (click)="closeCreateModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Create Group Event</h3>
          <button class="modal-close" (click)="closeCreateModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Title *</label>
            <input type="text" [(ngModel)]="newEvent.title" class="form-input" placeholder="Event title">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea [(ngModel)]="newEvent.description" class="form-input form-textarea" placeholder="Describe your event..." rows="3"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Type</label>
              <select [(ngModel)]="newEvent.eventType" class="form-input">
                <option *ngFor="let t of eventTypes" [value]="t">{{ getEventTypeLabel(t) }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Capacity</label>
              <input type="number" [(ngModel)]="newEvent.capacity" class="form-input" placeholder="Unlimited" min="0">
            </div>
          </div>
          <div class="form-group" *ngIf="newEvent.eventType !== EventType.ONLINE">
            <label>Location</label>
            <input type="text" [(ngModel)]="newEvent.location" class="form-input" placeholder="Event location">
          </div>
          <div class="form-group" *ngIf="newEvent.eventType !== EventType.IN_PERSON">
            <label>Meeting URL</label>
            <input type="url" [(ngModel)]="newEvent.meetingUrl" class="form-input" placeholder="https://meet.example.com">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Start Date & Time *</label>
              <input type="datetime-local" [(ngModel)]="newEvent.startAt" class="form-input">
            </div>
            <div class="form-group">
              <label>End Date & Time</label>
              <input type="datetime-local" [(ngModel)]="newEvent.endAt" class="form-input">
            </div>
          </div>
          <div class="form-group">
            <label>Tags</label>
            <input type="text" [(ngModel)]="newEvent.tags" class="form-input" placeholder="e.g. workshop, tech, networking">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeCreateModal()">Cancel</button>
          <button class="btn-submit" (click)="submitEvent()" [disabled]="submitting">
            {{ submitting ? 'Creating...' : 'Create Event' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .events-card {
      padding: 24px;
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }
    .events-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 12px;
    }
    .events-header h3 {
      margin: 0;
      color: #1c1e21;
      font-size: 16px;
      font-weight: 700;
    }
    .events-count {
      font-size: 13px;
      color: #65676b;
      font-weight: 600;
    }
    .btn-create-event {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #1c1e21;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-create-event:hover {
      background: #3a3b3c;
    }
    .empty-events-state {
      text-align: center;
      padding: 48px 24px;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e7eb;
      border-top-color: #1c1e21;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .empty-icon {
      width: 48px;
      height: 48px;
      color: #bcc0c4;
      margin-bottom: 12px;
    }
    .empty-events-state h4 {
      margin: 0 0 6px;
      color: #1c1e21;
      font-size: 15px;
      font-weight: 700;
    }
    .empty-events-state p {
      margin: 0;
      color: #65676b;
      font-size: 13px;
    }
    .events-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .event-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      background: white;
    }
    .event-card:hover {
      border-color: #d1d5db;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .event-date-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 56px;
      padding: 8px 12px;
      background: #f0f2f5;
      border-radius: 10px;
      text-align: center;
    }
    .event-date-month {
      font-size: 11px;
      font-weight: 700;
      color: #65676b;
      text-transform: uppercase;
    }
    .event-date-day {
      font-size: 20px;
      font-weight: 800;
      color: #1c1e21;
      line-height: 1.2;
    }
    .event-info {
      flex: 1;
      min-width: 0;
    }
    .event-title {
      margin: 0 0 6px;
      font-size: 15px;
      font-weight: 700;
      color: #1c1e21;
    }
    .event-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .event-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #65676b;
    }
    .event-type-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    .type-in_person {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .type-online {
      background: #e3f2fd;
      color: #1565c0;
    }
    .type-hybrid {
      background: #f3e5f5;
      color: #7b1fa2;
    }
    .event-status-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    .status-pending {
      background: #fff8e1;
      color: #f57f17;
    }
    .status-upcoming, .status-published {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .status-completed {
      background: #f5f5f5;
      color: #616161;
    }
    .status-cancelled {
      background: #ffebee;
      color: #c62828;
    }
    .status-draft {
      background: #f3e5f5;
      color: #7b1fa2;
    }
    .event-registrations {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 48px;
      text-align: center;
    }
    .reg-count {
      font-size: 18px;
      font-weight: 800;
      color: #1c1e21;
    }
    .reg-label {
      font-size: 10px;
      color: #65676b;
      text-transform: uppercase;
      font-weight: 600;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    }
    .modal-content {
      background: white;
      border-radius: 16px;
      width: 520px;
      max-width: 95vw;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #1c1e21;
    }
    .modal-close {
      background: none;
      border: none;
      font-size: 20px;
      color: #65676b;
      cursor: pointer;
      padding: 4px;
    }
    .modal-close:hover {
      color: #1c1e21;
    }
    .modal-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group label {
      font-size: 13px;
      font-weight: 600;
      color: #1c1e21;
    }
    .form-input {
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
    }
    .form-input:focus {
      border-color: #1c1e21;
    }
    .form-textarea {
      resize: vertical;
      min-height: 72px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
    }
    .btn-cancel {
      padding: 10px 20px;
      background: #f0f2f5;
      color: #1c1e21;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-cancel:hover {
      background: #e4e6eb;
    }
    .btn-submit {
      padding: 10px 20px;
      background: #1c1e21;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-submit:hover {
      background: #3a3b3c;
    }
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class GroupEventsTabComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  private authService = inject(AuthService);
  private groupService = inject(GroupService);

  groupId = '';
  events: Event[] = [];
  isOwner = false;
  submitting = false;
  loading = true;
  private paramSub?: Subscription;

  readonly EventType = EventType;
  eventTypes = Object.values(EventType);

  showCreateModal = false;
  newEvent = {
    title: '',
    description: '',
    eventType: EventType.IN_PERSON,
    location: '',
    meetingUrl: '',
    startAt: '',
    endAt: '',
    capacity: undefined as number | undefined,
    tags: ''
  };

  ngOnInit() {
    this.groupId = this.route.snapshot.parent?.paramMap.get('id') || '';
    if (this.groupId) {
      this.loadEvents();
      this.checkOwnership();
    }
  }

  ngOnDestroy() {
    this.paramSub?.unsubscribe();
  }

  checkOwnership() {
    this.groupService.getGroupById(this.groupId).subscribe({
      next: (group) => {
        const user = this.authService.currentUser();
        this.isOwner = user?.userId === group.creatorId;
      },
      error: () => this.isOwner = false
    });
  }

  loadEvents() {
    this.loading = true;
    this.eventService.getAllEvents(this.groupId).subscribe({
      next: (data) => {
        this.events = data;
        this.loading = false;
      },
      error: () => {
        this.events = [];
        this.loading = false;
      }
    });
  }

  openCreateModal() {
    this.newEvent = {
      title: '',
      description: '',
      eventType: EventType.IN_PERSON,
      location: '',
      meetingUrl: '',
      startAt: '',
      endAt: '',
      capacity: undefined,
      tags: ''
    };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  submitEvent() {
    if (!this.newEvent.title || !this.newEvent.startAt) return;

    this.submitting = true;
    const payload: Event = {
      title: this.newEvent.title,
      description: this.newEvent.description,
      eventType: this.newEvent.eventType,
      location: this.newEvent.location,
      meetingUrl: this.newEvent.meetingUrl,
      startAt: new Date(this.newEvent.startAt).toISOString(),
      endAt: this.newEvent.endAt ? new Date(this.newEvent.endAt).toISOString() : undefined,
      capacity: this.newEvent.capacity,
      tags: this.newEvent.tags,
      coverUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
    };

    this.eventService.createEvent({ ...payload, groupId: this.groupId }).subscribe({
      next: () => {
        this.submitting = false;
        this.closeCreateModal();
        this.loadEvents();
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  viewEvent(event: Event) {
    if (event.id) {
      this.router.navigate(['/etudiant/events', event.id]);
    }
  }

  getMonth(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en', { month: 'short' });
  }

  getDay(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.getDate().toString();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  getEventTypeLabel(type: EventType): string {
    switch (type) {
      case EventType.IN_PERSON: return 'In Person';
      case EventType.ONLINE: return 'Online';
      case EventType.HYBRID: return 'Hybrid';
      default: return type;
    }
  }

  getEventStatusLabel(status?: EventStatus): string {
    switch (status) {
      case EventStatus.DRAFT: return 'Draft';
      case EventStatus.PENDING: return 'Pending';
      case EventStatus.UPCOMING: return 'Upcoming';
      case EventStatus.PUBLISHED: return 'Published';
      case EventStatus.CANCELLED: return 'Cancelled';
      case EventStatus.COMPLETED: return 'Completed';
      default: return '';
    }
  }
}
