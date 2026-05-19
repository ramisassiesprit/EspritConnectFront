import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../core/services/event.service';
import { Event, EventStatus, EventType } from '../../../core/models/event.model';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-events.component.html',
  styleUrl: './admin-events.component.css'
})
export class AdminEventsComponent implements OnInit {
  private eventService = inject(EventService);

  events = signal<Event[]>([]);
  activeTab = signal<'pending' | 'approved' | 'all'>('pending');

  ngOnInit() {
    this.loadEvents();
  }

  getPendingCount(): number {
    return this.events().filter(e => e.status === EventStatus.PENDING).length;
  }

  loadEvents() {
    this.eventService.getAllEvents().subscribe({
      next: (data) => {
        this.events.set(data);
      },
      error: (err) => console.error('Failed to load events for admin', err)
    });
  }

  get filteredEvents(): Event[] {
    const list = this.events();
    if (this.activeTab() === 'pending') {
      return list.filter(e => e.status === EventStatus.PENDING);
    } else if (this.activeTab() === 'approved') {
      return list.filter(e => e.status === EventStatus.UPCOMING || e.status === EventStatus.PUBLISHED);
    }
    return list;
  }

  approve(eventId?: string) {
    if (!eventId) return;
    if (confirm("Voulez-vous vraiment approuver cet événement ? Il sera immédiatement publié et visible de tous.")) {
      this.eventService.approveEvent(eventId).subscribe({
        next: () => {
          alert("L'événement a été approuvé avec succès ! Une notification a été envoyée à tous les utilisateurs.");
          this.loadEvents();
        },
        error: (err) => alert("Erreur lors de l'approbation de l'événement")
      });
    }
  }

  reject(eventId?: string) {
    if (!eventId) return;
    if (confirm("Voulez-vous vraiment rejeter cet événement ?")) {
      this.eventService.rejectEvent(eventId).subscribe({
        next: () => {
          alert("L'événement a été rejeté.");
          this.loadEvents();
        },
        error: (err) => alert("Erreur lors du rejet de l'événement")
      });
    }
  }

  getEventTypeLabel(type: EventType): string {
    switch (type) {
      case EventType.IN_PERSON: return 'Présentiel';
      case EventType.ONLINE: return 'En Ligne';
      case EventType.HYBRID: return 'Hybride';
      default: return type;
    }
  }

  getEventStatusLabel(status?: EventStatus): string {
    switch (status) {
      case EventStatus.DRAFT: return 'Brouillon';
      case EventStatus.PENDING: return 'En attente';
      case EventStatus.UPCOMING: return 'Approuvé / À venir';
      case EventStatus.PUBLISHED: return 'Publié';
      case EventStatus.CANCELLED: return 'Rejeté / Annulé';
      case EventStatus.COMPLETED: return 'Terminé';
      default: return '';
    }
  }
}
