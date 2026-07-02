import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../../core/services/User.service';
import { User, UserStatus } from '../../../../core/models/user.model';
import { UserRole } from '../../../../core/models/user-role.enum';
import { environment } from '../../../../../environments/environment';
import { forkJoin } from 'rxjs';

interface RoleTab {
  role: UserRole;
  label: string;
  icon: string;
  color: string;
  count: number;
}

@Component({
  selector: 'app-users-by-role',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './users-by-role.component.html',
  styleUrl: './users-by-role.component.css'
})
export class UsersByRoleComponent implements OnInit {
  private userService = inject(UserService);

  // State
  loading = signal(true);
  actionLoading = signal<string | null>(null);

  selectedRole = signal<UserRole>(UserRole.ETUDIANT);
  searchQuery = '';
  selectedStatus: UserStatus | 'ALL' = 'ALL';
  sortField: keyof User = 'createdAt';
  sortAsc = false;

  allUsers: User[] = [];
  roleCounts: Record<string, number> = {};

  roleTabs: RoleTab[] = [
    { role: UserRole.ETUDIANT,   label: 'Étudiants',   icon: 'M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z', color: '#6366f1', count: 0 },
    { role: UserRole.ALUMNI,     label: 'Alumni',      icon: 'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z', color: '#8b5cf6', count: 0 },
    { role: UserRole.ENSEIGNANT, label: 'Enseignants', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', color: '#f59e0b', count: 0 },
    { role: UserRole.ENTREPRISE, label: 'Entreprises', icon: 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z', color: '#10b981', count: 0 },
    { role: UserRole.ADMIN,      label: 'Admins',      icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z', color: '#ef4444', count: 0 },
  ];

  readonly statuses: Array<{ value: UserStatus | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'Tous les statuts' },
    { value: UserStatus.ACTIVE, label: 'Actif' },
    { value: UserStatus.PENDING, label: 'En attente' },
    { value: UserStatus.REJECTED, label: 'Rejeté' },
  ];

  ngOnInit() {
    this.loadAllCounts();
    this.loadUsers();
  }

  // ── Load role counts in parallel ──
  private loadAllCounts() {
    const reqs = this.roleTabs.map(t => this.userService.getUsersByRole(t.role));
    forkJoin(reqs).subscribe({
      next: (results) => {
        this.roleTabs.forEach((tab, i) => {
          tab.count = results[i].length;
        });
      }
    });
  }

  loadUsers() {
    this.loading.set(true);
    this.userService.getUsersByRole(this.selectedRole()).subscribe({
      next: (users) => {
        this.allUsers = users;
        // Update count for selected tab
        const tab = this.roleTabs.find(t => t.role === this.selectedRole());
        if (tab) tab.count = users.length;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  selectRole(role: UserRole) {
    this.selectedRole.set(role);
    this.searchQuery = '';
    this.selectedStatus = 'ALL';
    this.loadUsers();
  }

  get filteredUsers(): User[] {
    let users = this.allUsers;

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      users = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.code || '').toLowerCase().includes(q)
      );
    }

    if (this.selectedStatus !== 'ALL') {
      users = users.filter(u => u.status === this.selectedStatus);
    }

    users = [...users].sort((a, b) => {
      const va = (a as any)[this.sortField] ?? '';
      const vb = (b as any)[this.sortField] ?? '';
      const cmp = String(va).localeCompare(String(vb));
      return this.sortAsc ? cmp : -cmp;
    });

    return users;
  }

  sort(field: keyof User) {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
  }

  activateUser(userId: string) {
    this.actionLoading.set(userId);
    this.userService.updateUserStatus(userId, UserStatus.ACTIVE).subscribe({
      next: () => { this.loadUsers(); this.actionLoading.set(null); },
      error: () => this.actionLoading.set(null)
    });
  }

  rejectUser(userId: string) {
    this.actionLoading.set(userId);
    this.userService.updateUserStatus(userId, UserStatus.REJECTED).subscribe({
      next: () => { this.loadUsers(); this.actionLoading.set(null); },
      error: () => this.actionLoading.set(null)
    });
  }

  deleteUser(userId: string) {
    if (!confirm('Supprimer cet utilisateur définitivement ?')) return;
    this.actionLoading.set(userId);
    this.userService.deleteUser(userId).subscribe({
      next: () => { this.loadUsers(); this.loadAllCounts(); this.actionLoading.set(null); },
      error: () => this.actionLoading.set(null)
    });
  }

  getAvatarUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('assets/')) {
      return url;
    }
    return `${environment.apiUrl.replace(/\/$/, '')}/${url.startsWith('/') ? url.substring(1) : url}`;
  }

  getInitials(u: User): string {
    return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
  }

  get activeTab(): RoleTab {
    return this.roleTabs.find(t => t.role === this.selectedRole())!;
  }

  get pendingCount(): number {
    return this.allUsers.filter(u => u.status === UserStatus.PENDING).length;
  }
}
