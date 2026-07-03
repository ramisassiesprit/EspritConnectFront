import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { GroupService } from '../../../../core/services/group.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-groups-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './groups-manage.component.html',
  styleUrls: ['./groups-manage.component.css']
})
export class GroupsManageComponent implements OnInit {
  private groupService = inject(GroupService);
  private router = inject(Router);

  groups: any[] = [];
  approvedGroups: any[] = [];
  pendingGroups: any[] = [];
  rejectedGroups: any[] = [];
  loading = false;
  error = '';
  searchQuery = '';
  filterStatus = 'ALL';

  getImageUrl(path?: string) {
    if (!path) return null;
    return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
  }

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups() {
    this.loading = true;
    forkJoin({
      approved: this.groupService.getAllGroups(),
      pending: this.groupService.getPendingGroups()
    }).subscribe({
      next: ({ approved, pending }) => {
        // merge lists (pending may be empty or contain groups not in approved)
        const ids = new Set<string>();
        this.groups = [];
        [...approved, ...pending].forEach(g => {
          if (!ids.has(g.id)) { ids.add(g.id); this.groups.push(g); }
        });
        this.groupByStatus();
        this.loading = false;
      },
      error: (err) => { this.error = 'Failed to load groups'; console.error(err); this.loading = false; }
    });
  }

  groupByStatus() {
    this.approvedGroups = this.groups.filter(g => g.status === 'APPROVED');
    this.pendingGroups = this.groups.filter(g => g.status === 'PENDING');
    this.rejectedGroups = this.groups.filter(g => g.status === 'REJECTED' || g.status === 'BANNED');
  }

  get filteredGroups(): any[] {
    let result = [...this.groups];
    if (this.filterStatus !== 'ALL') {
      if (this.filterStatus === 'REJECTED') {
        result = result.filter(g => g.status === 'REJECTED' || g.status === 'BANNED');
      } else {
        result = result.filter(g => g.status === this.filterStatus);
      }
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(g =>
        g.groupName?.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q) ||
        g.labels?.toLowerCase().includes(q)
      );
    }
    return result;
  }

  viewGroup(id: string) {
    this.router.navigate(['/etudiant/groups', id, 'feed']);
  }

  editGroup(id: string) {
    this.router.navigate(['/admin/groups', id, 'edit']);
  }

  approve(id: string) {
    if (!confirm('Approve this group?')) return;
    this.groupService.approveGroup(id).subscribe({ next: () => this.loadGroups(), error: e => console.error(e) });
  }

  reject(id: string) {
    if (!confirm('Reject this group?')) return;
    this.groupService.rejectGroup(id).subscribe({ next: () => this.loadGroups(), error: e => console.error(e) });
  }

  delete(id: string) {
    if (!confirm('Delete this group permanently?')) return;
    this.groupService.deleteGroup(id).subscribe({ next: () => this.loadGroups(), error: e => console.error(e) });
  }

  changeStatus(id: string, status: string) {
    if (!confirm('Change group status to ' + status + ' ?')) return;
    this.loading = true;
    this.groupService.setGroupStatus(id, status as any).subscribe({
      next: () => { this.loadGroups(); },
      error: e => { console.error(e); this.loading = false; }
    });
  }
}
