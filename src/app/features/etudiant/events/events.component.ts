import Swal from 'sweetalert2';
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { UserService } from '../../../core/services/User.service';
import { AuthService } from '../../../core/services/auth.service';
import { Event, EventType, EventStatus, EventRegistration } from '../../../core/models/event.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent implements OnInit {
  private eventService = inject(EventService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);

  events = signal<Event[]>([]);
  registeredEvents = signal<Event[]>([]);
  recommendedEvents = signal<Event[]>([]);
  currentUser = signal<User | null>(null);

  // Filters
  activeTab = signal<'all' | 'my-registrations' | 'my-created'>('all');
  selectedEventType = signal<string>('ALL');

  // Modals
  showCreateModal = signal(false);
  showDetailsModal = signal(false);
  selectedEvent = signal<Event | null>(null);
  selectedEventRegistrations = signal<EventRegistration[]>([]);
  feedbacks = signal<EventRegistration[]>([]);
  winners = signal<EventRegistration[]>([]);

  // Feedback form state
  userRating = 5;
  userComment = '';

  // Form Model
  newEvent = {
    title: '',
    description: '',
    eventType: EventType.IN_PERSON,
    location: '',
    meetingUrl: '',
    startAt: '',
    endAt: '',
    capacity: undefined as number | undefined,
    coverUrl: '',
    tags: ''
  };

  eventTypes = Object.values(EventType);

  ngOnInit() {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.loadData();
      },
      error: (err) => console.error('Failed to get current user', err)
    });
  }

  loadData() {
    this.eventService.getAllEvents().subscribe({
      next: (eventsList) => {
        this.events.set(eventsList);
      },
      error: (err) => console.error('Failed to load events', err)
    });

    this.eventService.getRecommendedEvents().subscribe({
      next: (recs) => {
        this.recommendedEvents.set(recs);
        console.log("Scores de recommandation des événements :");
        recs.forEach(event => {
          console.log(`- ${event.title} : ${event.matchScore}`);
        });
      },
      error: (err) => console.error('Failed to load recommended events', err)
    });

    const user = this.currentUser();
    if (user) {
      this.eventService.getUserEvents(user.id).subscribe({
        next: (userRegistrations) => {
          this.registeredEvents.set(userRegistrations);
        },
        error: (err) => console.error('Failed to load user registered events', err)
      });
    }
  }

  get filteredEvents(): Event[] {
    let result = this.events();
    const user = this.currentUser();

    // Tab filter
    if (this.activeTab() === 'my-registrations') {
      const regIds = new Set(this.registeredEvents().map(e => e.id));
      result = result.filter(e => regIds.has(e.id));
    } else if (this.activeTab() === 'my-created') {
      if (user) {
        result = result.filter(e => e.creatorId === user.id);
      }
    }

    // Type filter
    if (this.selectedEventType() !== 'ALL') {
      result = result.filter(e => e.eventType === this.selectedEventType());
    }

    // Sort by starting date
    return result.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }

  getMyCreatedCount(): number {
    const user = this.currentUser();
    if (!user) return 0;
    return this.events().filter(e => e.creatorId === user.id).length;
  }

  isRegistered(eventId?: string): boolean {
    if (!eventId) return false;
    return this.registeredEvents().some(e => e.id === eventId);
  }

  register(eventId?: string, eventClick?: MouseEvent) {
    if (eventClick) eventClick.stopPropagation();
    if (!eventId) return;

    this.eventService.registerToEvent(eventId).subscribe({
      next: () => {
        this.loadData();
        if (this.showDetailsModal() && this.selectedEvent()?.id === eventId) {
          this.openDetails(this.selectedEvent()!);
        }
      },
      error: (err) => Swal.fire(err.error?.message || "Erreur lors de l'inscription")
    });
  }

  unregister(eventId?: string, eventClick?: MouseEvent) {
    if (eventClick) eventClick.stopPropagation();
    if (!eventId) return;

    this.eventService.unregisterFromEvent(eventId).subscribe({
      next: () => {
        this.loadData();
        if (this.showDetailsModal() && this.selectedEvent()?.id === eventId) {
          this.openDetails(this.selectedEvent()!);
        }
      },
      error: (err) => Swal.fire("Erreur lors de la désinscription")
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
      coverUrl: '',
      tags: ''
    };
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  submitEvent() {
    if (!this.newEvent.title || !this.newEvent.startAt) {
      Swal.fire("Le titre et la date de début sont obligatoires.");
      return;
    }

    const payload: Event = {
      title: this.newEvent.title,
      description: this.newEvent.description,
      eventType: this.newEvent.eventType,
      location: this.newEvent.location,
      meetingUrl: this.newEvent.meetingUrl,
      startAt: new Date(this.newEvent.startAt).toISOString(),
      endAt: this.newEvent.endAt ? new Date(this.newEvent.endAt).toISOString() : undefined,
      capacity: this.newEvent.capacity,
      coverUrl: this.newEvent.coverUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      tags: this.newEvent.tags
    };

    this.eventService.createEvent(payload).subscribe({
      next: (created) => {
        this.closeCreateModal();
        this.loadData();
        if (created.status === EventStatus.PENDING) {
          Swal.fire("Votre événement a été créé avec succès ! Il sera visible de tous dès qu'un administrateur l'aura approuvé.");
        } else {
          Swal.fire("Votre événement a été créé et publié avec succès !");
        }
      },
      error: (err) => Swal.fire("Erreur lors de la création de l'événement")
    });
  }

  openDetails(event: Event) {
    if (event.id) {
      this.router.navigate(['/etudiant/events', event.id]);
    }
  }

  closeDetailsModal() {
    this.showDetailsModal.set(false);
    this.selectedEvent.set(null);
    this.selectedEventRegistrations.set([]);
    this.feedbacks.set([]);
    this.winners.set([]);
    this.userRating = 5;
    this.userComment = '';
  }

  checkInUser(userId: string) {
    const event = this.selectedEvent();
    if (!event || !event.id) return;
    this.eventService.checkIn(event.id, userId).subscribe({
      next: () => {
        Swal.fire("Présence validée avec succès !");
        this.openDetails(event);
      },
      error: (err) => Swal.fire(err.error?.message || "Erreur lors de la validation de présence")
    });
  }

  declareWinner(userId: string) {
    const event = this.selectedEvent();
    if (!event || !event.id) return;
    const rankStr = prompt("Entrez le classement du gagnant (ex: 1 pour 1er, 2 pour 2ème...) :");
    if (rankStr === null) return;
    const rank = rankStr ? parseInt(rankStr, 10) : undefined;

    this.eventService.declareWinner(event.id, userId, rank).subscribe({
      next: () => {
        Swal.fire("Gagnant déclaré avec succès ! Le badge de vainqueur a été généré et attribué.");
        this.openDetails(event);
      },
      error: (err) => Swal.fire(err.error?.message || "Erreur lors de la désignation du vainqueur")
    });
  }

  submitFeedback() {
    const event = this.selectedEvent();
    if (!event || !event.id) return;
    this.eventService.submitFeedback(event.id, this.userRating, this.userComment).subscribe({
      next: () => {
        Swal.fire("Votre avis a été enregistré. Merci pour votre retour !");
        this.userComment = '';
        this.openDetails(event);
      },
      error: (err) => Swal.fire(err.error?.message || "Erreur lors de la soumission de l'avis")
    });
  }

  getRegistrationStatus(eventId?: string): string {
    if (!eventId || !this.currentUser()) return '';
    const user = this.currentUser();
    const reg = this.selectedEventRegistrations().find(r => r.userId === user?.id);
    return reg ? reg.status : '';
  }

  getRegistrationId(eventId?: string): string {
    if (!eventId || !this.currentUser()) return '';
    const user = this.currentUser();
    const reg = this.selectedEventRegistrations().find(r => r.userId === user?.id);
    return reg ? reg.id || '' : '';
  }

  hasAttended(eventId?: string): boolean {
    return this.getRegistrationStatus(eventId) === 'ATTENDED';
  }

  hasFeedbackSubmitted(): boolean {
    const user = this.currentUser();
    return this.feedbacks().some(f => f.userId === user?.id);
  }

  printCertificate() {
    window.print();
  }

  getStars(rating?: number): number[] {
    if (!rating) return [];
    return Array(rating).fill(0);
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
      case EventStatus.PENDING: return "En attente d'approbation";
      case EventStatus.UPCOMING: return 'À venir';
      case EventStatus.PUBLISHED: return 'Publié';
      case EventStatus.CANCELLED: return 'Annulé';
      case EventStatus.COMPLETED: return 'Terminé';
      default: return '';
    }
  }
}
