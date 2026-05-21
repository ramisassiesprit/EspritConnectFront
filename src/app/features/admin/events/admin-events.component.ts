import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, ChartOptions, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import Swal from 'sweetalert2';

Chart.register(...registerables);
import { EventService } from '../../../core/services/event.service';
import { Event, EventStatus, EventType } from '../../../core/models/event.model';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './admin-events.component.html',
  styleUrl: './admin-events.component.css'
})
export class AdminEventsComponent implements OnInit {
  private eventService = inject(EventService);

  // ---------- Gestion des événements ----------
  events = signal<Event[]>([]);
  activeTab = signal<'pending' | 'approved' | 'completed' | 'all'>('pending');

  // Computed property pour filtrer les événements
  filteredEvents = computed(() => {
    const allEvents = this.events();
    const tab = this.activeTab();
    const now = new Date();

    switch (tab) {
      case 'pending':
        return allEvents.filter(e => e.status === EventStatus.PENDING);
      case 'approved':
        // Événements approuvés à venir ou en cours
        return allEvents.filter(e => {
          const isApproved = e.status === EventStatus.UPCOMING || e.status === EventStatus.PUBLISHED;
          if (!isApproved) return false;
          if (!e.startAt) return true;
          return new Date(e.startAt) >= now;
        });
      case 'completed':
        // Événements passés (date dépassée) ou explicitement marqués COMPLETED
        return allEvents.filter(e => {
          if (e.status === EventStatus.COMPLETED) return true;
          if (e.status === EventStatus.CANCELLED) return false;
          if (!e.startAt) return false;
          return new Date(e.startAt) < now;
        });
      case 'all':
      default:
        return allEvents;
    }
  });

  // ---------- Section Statistiques ----------
  activeSection = signal<'events' | 'stats'>('events');
  adminStats: any = null;
  loadingStats = signal(false);

  // Chart configurations (Chart.js)
  lineChartOptions: ChartOptions<'line'> = { 
    responsive: true, 
    plugins: { 
      legend: { display: true },
      title: { display: true, text: 'Évolution des inscriptions au fil des mois' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };
  lineChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };

  pieChartOptions: ChartOptions<'pie'> = { 
    responsive: true, 
    plugins: { 
      legend: { position: 'right' },
      title: { display: true, text: 'Répartition des événements par type' }
    } 
  };
  pieChartData: ChartConfiguration<'pie'>['data'] = { labels: [], datasets: [] };

  barChartOptions: ChartOptions<'bar'> = { 
    responsive: true, 
    plugins: { 
      legend: { display: false },
      title: { display: true, text: 'État des événements' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };
  barChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

  ngOnInit(): void {
    this.loadEvents();
    this.loadStats();
  }

  // ---------- Gestion des événements ----------
  loadEvents(): void {
    this.eventService.getAllEvents().subscribe({
      next: data => this.events.set(data),
      error: err => {
        console.error('Failed to load events', err);
        Swal.fire('Erreur', 'Impossible de charger les événements', 'error');
      }
    });
  }

  // ---------- Statistiques ----------
  loadStats(): void {
    this.loadingStats.set(true);
    this.eventService.getAdminEventStats().subscribe({
      next: stats => {
        this.adminStats = stats;
        this.prepareCharts();
        this.loadingStats.set(false);
      },
      error: err => {
        console.error('Failed to load admin stats', err);
        Swal.fire('Erreur', 'Impossible de charger les statistiques', 'error');
        this.loadingStats.set(false);
      }
    });
  }

  prepareCharts(): void {
    if (!this.adminStats) return;

    // Line chart – inscriptions par mois
    const monthLabels = Object.keys(this.adminStats.registrationsByMonth || {});
    const monthValues = monthLabels.map(m => this.adminStats.registrationsByMonth[m]);
    
    this.lineChartData = {
      labels: monthLabels,
      datasets: [
        {
          label: 'Inscriptions',
          data: monthValues,
          fill: true,
          tension: 0.4,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          pointRadius: 5,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    };

    // Pie chart – répartition par type
    const typeLabels = Object.keys(this.adminStats.eventsByType || {});
    const typeValues = typeLabels.map(t => this.adminStats.eventsByType[t]);
    
    this.pieChartData = {
      labels: typeLabels,
      datasets: [
        {
          data: typeValues,
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    };

    // Bar chart – statut des événements
    const statusLabels = Object.keys(this.adminStats.eventsByStatus || {});
    const statusValues = statusLabels.map(s => this.adminStats.eventsByStatus[s]);
    
    this.barChartData = {
      labels: statusLabels,
      datasets: [
        {
          label: 'Nombre d\'événements',
          data: statusValues,
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
          borderColor: ['#1e40af', '#047857', '#d97706', '#dc2626', '#6d28d9', '#be185d'],
          borderWidth: 2
        }
      ]
    };
  }

  // ---------- Utilitaires ----------
  getPendingCount(): number {
    return this.events().filter(e => e.status === EventStatus.PENDING).length;
  }

  getEventTypeLabel(type: EventType): string {
    switch (type) {
      case EventType.IN_PERSON:
        return 'Présentiel';
      case EventType.ONLINE:
        return 'En Ligne';
      case EventType.HYBRID:
        return 'Hybride';
      default:
        return type || '';
    }
  }

  getEventStatusLabel(status?: EventStatus): string {
    switch (status) {
      case EventStatus.DRAFT:
        return 'Brouillon';
      case EventStatus.PENDING:
        return 'En attente';
      case EventStatus.UPCOMING:
        return 'Approuvé / À venir';
      case EventStatus.PUBLISHED:
        return 'Publié';
      case EventStatus.CANCELLED:
        return 'Rejeté / Annulé';
      case EventStatus.COMPLETED:
        return 'Terminé';
      default:
        return '';
    }
  }

  // ---------- Actions ----------
  approve(eventId?: string): void {
    if (!eventId) return;
    
    Swal.fire({
      title: 'Approuver l\'événement ?',
      text: 'Êtes-vous sûr de vouloir approuver cet événement ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, approuver',
      cancelButtonText: 'Annuler'
    }).then(result => {
      if (result.isConfirmed) {
        this.eventService.approveEvent(eventId).subscribe({
          next: () => {
            Swal.fire('Succès', 'Événement approuvé avec succès', 'success');
            this.loadEvents();
            this.loadStats();
          },
          error: err => {
            console.error('Erreur lors de l\'approbation', err);
            Swal.fire('Erreur', 'Impossible d\'approuver l\'événement', 'error');
          }
        });
      }
    });
  }

  reject(eventId?: string): void {
    if (!eventId) return;
    
    Swal.fire({
      title: 'Rejeter l\'événement ?',
      text: 'Êtes-vous sûr de vouloir rejeter cet événement ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, rejeter',
      cancelButtonText: 'Annuler'
    }).then(result => {
      if (result.isConfirmed) {
        this.eventService.rejectEvent(eventId).subscribe({
          next: () => {
            Swal.fire('Succès', 'Événement rejeté avec succès', 'success');
            this.loadEvents();
            this.loadStats();
          },
          error: err => {
            console.error('Erreur lors du rejet', err);
            Swal.fire('Erreur', 'Impossible de rejeter l\'événement', 'error');
          }
        });
      }
    });
  }
}