import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserService } from '../../../core/services/User.service';
import { EventService } from '../../../core/services/event.service';
import { JobService } from '../../../core/services/job.service';
import { PostService } from '../../../core/services/post.service';
import { User, UserStatus } from '../../../core/models/user.model';
import { UserRole } from '../../../core/models/user-role.enum';
import { environment } from '../../../../environments/environment';

interface KpiCard {
  label: string;
  value: number | string;
  delta?: string;
  deltaPositive?: boolean;
  icon: string;
  color: string;
}

interface RecentUser {
  name: string;
  role: string;
  avatarUrl?: string;
  createdAt?: string;
}

interface QuickAction {
  label: string;
  description: string;
  route: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private userService = inject(UserService);
  private eventService = inject(EventService);
  private jobService = inject(JobService);
  private postService = inject(PostService);

  isLoading = true;
  adminName = 'Admin';
  today = new Date();
  currentHour = new Date().getHours();

  kpis: KpiCard[] = [];
  recentUsers: RecentUser[] = [];
  pendingCount = 0;

  // Role distribution for donut chart
  roleDistribution: { role: string; count: number; color: string; percent: number }[] = [];

  // Activity data (mocked weeks)
  activityWeeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
  activityData: number[] = [0, 0, 0, 0];
  maxActivity = 1;

  quickActions: QuickAction[] = [
    {
      label: 'Approuver les utilisateurs',
      description: 'Traiter les demandes en attente',
      route: '/admin/users/approval',
      icon: 'check_circle',
      color: '#10b981'
    },
    {
      label: 'Envoyer un mailing',
      description: 'Contacter les membres',
      route: '/admin/users/mailing',
      icon: 'mail',
      color: '#6366f1'
    },
    {
      label: 'Gérer les événements',
      description: 'Créer ou modifier des événements',
      route: '/admin/events',
      icon: 'event',
      color: '#f59e0b'
    },
    {
      label: 'Gérer les offres',
      description: 'Modérer les offres d\'emploi',
      route: '/admin/jobs',
      icon: 'work',
      color: '#ef4444'
    },
    {
      label: 'Gestion des affiliations',
      description: 'Rôles et permissions',
      route: '/admin/users/affiliations',
      icon: 'group',
      color: '#8b5cf6'
    },
    {
      label: 'Paramètres',
      description: 'Configurer la plateforme',
      route: '/admin/settings/homepage',
      icon: 'settings',
      color: '#64748b'
    }
  ];

  get greeting(): string {
    if (this.currentHour < 12) return 'Bonjour';
    if (this.currentHour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  ngOnInit() {
    this.loadDashboardData();
    this.loadCurrentAdmin();
  }

  private loadCurrentAdmin() {
    this.userService.getCurrentUser().pipe(catchError(() => of(null))).subscribe(user => {
      if (user) {
        this.adminName = user.firstName || 'Admin';
      }
    });
  }

  private loadDashboardData() {
    this.isLoading = true;

    const users$ = this.userService.getAllUsers().pipe(catchError(() => of([] as User[])));
    const events$ = this.eventService.getAllEvents().pipe(catchError(() => of([])));
    const jobs$ = this.jobService.getAllJobs().pipe(catchError(() => of([])));
    const posts$ = this.postService.getFeedPosts().pipe(catchError(() => of([])));

    forkJoin({ users: users$, events: events$, jobs: jobs$, posts: posts$ }).subscribe({
      next: ({ users, events, jobs, posts }) => {
        this.buildKpis(users, events, jobs, posts);
        this.buildRoleDistribution(users);
        this.buildRecentUsers(users);
        this.buildActivityData(users);
        this.isLoading = false;
      },
      error: () => {
        // Fallback with empty data
        this.buildKpis([], [], [], []);
        this.isLoading = false;
      }
    });
  }

  private buildKpis(users: User[], events: any[], jobs: any[], posts: any[]) {
    const total = users.length;
    const pending = users.filter(u => u.status === UserStatus.PENDING).length;
    const active = users.filter(u => u.status === UserStatus.ACTIVE).length;
    const thisWeek = users.filter(u => {
      if (!u.createdAt) return false;
      const d = new Date(u.createdAt);
      const now = new Date();
      const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
      return diff <= 7;
    }).length;

    this.pendingCount = pending;

    this.kpis = [
      {
        label: 'Utilisateurs totaux',
        value: total,
        delta: `+${thisWeek} cette semaine`,
        deltaPositive: true,
        icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
        color: '#6366f1'
      },
      {
        label: 'En attente d\'approbation',
        value: pending,
        delta: pending > 0 ? 'Action requise' : 'Tout est traité',
        deltaPositive: pending === 0,
        icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
        color: pending > 0 ? '#f59e0b' : '#10b981'
      },
      {
        label: 'Membres actifs',
        value: active,
        delta: total > 0 ? `${Math.round(active / total * 100)}% du total` : '0%',
        deltaPositive: true,
        icon: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
        color: '#10b981'
      },
      {
        label: 'Événements actifs',
        value: events.length,
        delta: 'Sur la plateforme',
        deltaPositive: true,
        icon: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z',
        color: '#8b5cf6'
      },
      {
        label: 'Offres d\'emploi',
        value: jobs.length,
        delta: 'Disponibles',
        deltaPositive: true,
        icon: 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z',
        color: '#ef4444'
      },
      {
        label: 'Posts publiés',
        value: posts.length,
        delta: 'Sur le feed',
        deltaPositive: true,
        icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
        color: '#0ea5e9'
      }
    ];
  }

  private buildRoleDistribution(users: User[]) {
    const total = users.length || 1;
    const roles = [
      { role: 'Étudiants', key: UserRole.ETUDIANT, color: '#6366f1' },
      { role: 'Anciens', key: UserRole.ALUMNI, color: '#8b5cf6' },
      { role: 'Enseignants', key: UserRole.ENSEIGNANT, color: '#f59e0b' },
      { role: 'Entreprises', key: UserRole.ENTREPRISE, color: '#10b981' },
      { role: 'Admins', key: UserRole.ADMIN, color: '#ef4444' },
    ];

    this.roleDistribution = roles.map(r => {
      const count = users.filter(u => u.role === r.key).length;
      return { role: r.role, count, color: r.color, percent: Math.round(count / total * 100) };
    }).filter(r => r.count > 0);
  }

  private buildRecentUsers(users: User[]) {
    this.recentUsers = [...users]
      .sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      })
      .slice(0, 6)
      .map(u => ({
        name: `${u.firstName} ${u.lastName}`,
        role: this.roleLabel(u.role),
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt
      }));
  }

  private buildActivityData(users: User[]) {
    const now = new Date();
    const weeks = [3, 2, 1, 0].map(weeksAgo => {
      const start = new Date(now);
      start.setDate(start.getDate() - (weeksAgo + 1) * 7);
      const end = new Date(now);
      end.setDate(end.getDate() - weeksAgo * 7);
      return users.filter(u => {
        if (!u.createdAt) return false;
        const d = new Date(u.createdAt);
        return d >= start && d < end;
      }).length;
    });
    this.activityData = weeks;
    this.maxActivity = Math.max(...weeks, 1);
  }

  roleLabel(role: UserRole): string {
    const map: Record<string, string> = {
      ETUDIANT: 'Étudiant',
      ANCIEN: 'Ancien',
      ENSEIGNANT: 'Enseignant',
      ENTREPRISE: 'Entreprise',
      ADMIN: 'Admin'
    };
    return map[role] || role;
  }

  getAvatarUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl.replace(/\/$/, '')}${url}`;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  timeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `il y a ${days}j`;
  }

  barHeight(val: number): number {
    return Math.round((val / this.maxActivity) * 100);
  }

  // Donut chart arc calculation
  getDonutOffset(index: number): number {
    let offset = 25; // start at top (25% of circumference = 90deg offset)
    for (let i = 0; i < index; i++) {
      offset -= this.roleDistribution[i].percent;
    }
    return offset;
  }

  get donutTotal(): number {
    return this.roleDistribution.reduce((s, r) => s + r.count, 0) || 1;
  }
}
