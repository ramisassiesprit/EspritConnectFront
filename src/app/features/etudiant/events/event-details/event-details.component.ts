import Swal from 'sweetalert2';
import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventService } from '../../../../core/services/event.service';
import { UserService } from '../../../../core/services/User.service';
import { Event, EventType, EventRegistration } from '../../../../core/models/event.model';
import { User } from '../../../../core/models/user.model';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './event-details.component.html',
  styleUrl: './event-details.component.css'
})
export class EventDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  private userService = inject(UserService);

  eventId = signal<string | null>(null);
  selectedEvent = signal<Event | null>(null);
  selectedEventRegistrations = signal<EventRegistration[]>([]);
  feedbacks = signal<EventRegistration[]>([]);
  winners = signal<EventRegistration[]>([]);
  currentUser = signal<User | null>(null);
  registeredEvents = signal<Event[]>([]);

  // Print Type: presence or winner
  printType = signal<'presence' | 'winner'>('presence');

  // QR Scanner State
  qrScanner: any = null;
  isScanning = signal(false);
  scannedCode = signal<string | null>(null);
  scanSuccessMessage = signal<string | null>(null);
  manualCodeInput = '';

  // Feedback form state
  userRating = 5;
  userComment = '';

  ngOnInit() {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.loadRouteData();
      },
      error: (err) => console.error('Failed to get current user', err)
    });
  }

  ngOnDestroy() {
    if (this.qrScanner) {
      try {
        this.qrScanner.stop();
      } catch (e) {}
    }
  }

  loadRouteData() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.eventId.set(id);
        this.loadEventData(id);
      } else {
        this.router.navigate(['/etudiant/events']);
      }
    });
  }

  loadEventData(id: string) {
    this.eventService.getEventById(id).subscribe({
      next: (event) => {
        this.selectedEvent.set(event);
        this.loadAdditionalData(id);
      },
      error: (err) => {
        console.error('Failed to load event details', err);
        this.router.navigate(['/etudiant/events']);
      }
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

  loadAdditionalData(id: string) {
    this.eventService.getEventRegistrations(id).subscribe({
      next: (regs) => {
        this.selectedEventRegistrations.set(regs);
      },
      error: (err) => console.error('Failed to load event registrations', err)
    });

    this.eventService.getFeedbacks(id).subscribe({
      next: (feeds) => {
        this.feedbacks.set(feeds);
      },
      error: (err) => console.error('Failed to load event feedbacks', err)
    });

    this.eventService.getWinners(id).subscribe({
      next: (wins) => {
        this.winners.set(wins);
      },
      error: (err) => console.error('Failed to load event winners', err)
    });
  }

  isRegistered(eventId?: string): boolean {
    if (!eventId) return false;
    return this.registeredEvents().some(e => e.id === eventId);
  }

  register(eventId?: string) {
    if (!eventId) return;

    this.eventService.registerToEvent(eventId).subscribe({
      next: () => {
        this.loadEventData(eventId);
      },
      error: (err) => Swal.fire(err.error?.message || "Erreur lors de l'inscription")
    });
  }

  unregister(eventId?: string) {
    if (!eventId) return;

    this.eventService.unregisterFromEvent(eventId).subscribe({
      next: () => {
        this.loadEventData(eventId);
      },
      error: (err) => Swal.fire("Erreur lors de la désinscription")
    });
  }

  checkInUser(userId: string) {
    const id = this.eventId();
    if (!id) return;
    this.eventService.checkIn(id, userId).subscribe({
      next: () => {
        Swal.fire("Présence validée avec succès !");
        this.loadAdditionalData(id);
      },
      error: (err) => Swal.fire(err.error?.message || "Erreur lors de la validation de présence")
    });
  }

  declareWinner(userId: string) {
    const id = this.eventId();
    if (!id) return;
    const rankStr = prompt("Entrez le classement du gagnant (ex: 1 pour 1er, 2 pour 2ème...) :");
    if (rankStr === null) return;
    const rank = rankStr ? parseInt(rankStr, 10) : undefined;

    this.eventService.declareWinner(id, userId, rank).subscribe({
      next: () => {
        Swal.fire("Gagnant déclaré avec succès ! Le badge de vainqueur a été généré et attribué.");
        this.loadAdditionalData(id);
      },
      error: (err) => Swal.fire(err.error?.message || "Erreur lors de la désignation du vainqueur")
    });
  }

  submitFeedback() {
    const id = this.eventId();
    if (!id) return;
    this.eventService.submitFeedback(id, this.userRating, this.userComment).subscribe({
      next: () => {
        Swal.fire("Votre avis a été enregistré. Merci pour votre retour !");
        this.userComment = '';
        this.loadAdditionalData(id);
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

  isWinnerOfEvent(eventId?: string): boolean {
    if (!eventId || !this.currentUser()) return false;
    const user = this.currentUser();
    const reg = this.selectedEventRegistrations().find(r => r.userId === user?.id);
    return reg ? !!reg.isWinner : false;
  }

  getWinnerRank(eventId?: string): number | undefined {
    if (!eventId || !this.currentUser()) return undefined;
    const user = this.currentUser();
    const reg = this.selectedEventRegistrations().find(r => r.userId === user?.id);
    return reg ? reg.winnerRank : undefined;
  }

  hasFeedbackSubmitted(): boolean {
    const user = this.currentUser();
    return this.feedbacks().some(f => f.userId === user?.id);
  }

  printCertificate() {
    this.printType.set('presence');
    setTimeout(() => {
      window.print();
    }, 150);
  }

  printWinnerCertificate() {
    this.printType.set('winner');
    setTimeout(() => {
      window.print();
    }, 150);
  }

  getStars(rating?: number): number[] {
    if (!rating) return [];
    return Array(rating).fill(0);
  }

  getEventTypeLabel(type?: EventType): string {
    if (!type) return '';
    switch (type) {
      case EventType.IN_PERSON: return 'Présentiel';
      case EventType.ONLINE: return 'En Ligne';
      case EventType.HYBRID: return 'Hybride';
      default: return type;
    }
  }

  goBack() {
    this.router.navigate(['/etudiant/events']);
  }

  // QR Scanner Controller Actions
  startScanner() {
    this.isScanning.set(true);
    this.scannedCode.set(null);
    this.scanSuccessMessage.set(null);

    setTimeout(() => {
      this.qrScanner = new Html5Qrcode("qr-reader");
      this.qrScanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText: string) => {
          this.handleScannedQR(decodedText);
        },
        (errorMessage: string) => {
          // Silent scan error
        }
      ).catch((err: any) => {
        console.error("Camera access failed", err);
        Swal.fire("Impossible d'accéder à la caméra : " + err);
        this.isScanning.set(false);
      });
    }, 200);
  }

  stopScanner() {
    if (this.qrScanner) {
      this.qrScanner.stop().then(() => {
        this.qrScanner = null;
        this.isScanning.set(false);
      }).catch((err: any) => {
        console.error("Failed to stop scanner", err);
        this.isScanning.set(false);
      });
    } else {
      this.isScanning.set(false);
    }
  }

  handleScannedQR(code: string) {
    if (navigator.vibrate) navigator.vibrate(200);
    this.stopScanner();
    this.scannedCode.set(code);

    this.eventService.checkInByRegistrationId(code).subscribe({
      next: (updatedRegistration) => {
        this.scanSuccessMessage.set(`Validation réussie pour ${updatedRegistration.userFullName} !`);
        const eventId = this.eventId();
        if (eventId) this.loadEventData(eventId);
      },
      error: (err) => {
        Swal.fire(err.error?.message || "Erreur de check-in : Code QR invalide ou déjà scanné");
        this.scannedCode.set(null);
      }
    });
  }

  submitManualCheckIn() {
    if (!this.manualCodeInput.trim()) return;
    this.handleScannedQR(this.manualCodeInput.trim());
    this.manualCodeInput = '';
  }
}
