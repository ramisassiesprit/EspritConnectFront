import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { GroupService } from '../../../../core/services/group.service';
import { UserService } from '../../../../core/services/User.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-groups-control',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './groups-control.component.html',
  styleUrls: ['./groups-control.component.css']
})
export class GroupsControlComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private groupService = inject(GroupService);
  private router = inject(Router);
  private userService = inject(UserService);

  group: any | null = null;
  owner: any | null = null;
  members: any[] = [];
  loading = false;
  error = '';

  getImageUrl(path?: string) {
    if (!path) return null;
    return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadGroup(id);
  }

  loadGroup(id: string) {
    this.loading = true;
    this.groupService.getGroupById(id).subscribe({
      next: g => {
        this.group = g;
        this.loading = false;
        if (g?.creatorId) {
          this.userService.getUserById(g.creatorId).subscribe({ next: u => this.owner = u, error: e => console.error('Failed load owner', e) });
        }
        this.groupService.getGroupMembers(id).subscribe({ next: m => this.members = m, error: e => console.error('Failed load members', e) });
      },
      error: e => { console.error(e); this.error = 'Failed to load'; this.loading = false; }
    });
  }

  approve() {
    if (!this.group) return;
    this.groupService.approveGroup(this.group.id).subscribe({ next: () => this.loadGroup(this.group.id), error: e => console.error(e) });
  }

  reject() {
    if (!this.group) return;
    this.groupService.rejectGroup(this.group.id).subscribe({ next: () => this.loadGroup(this.group.id), error: e => console.error(e) });
  }

  deleteGroup() {
    if (!this.group) return;
    if (!confirm('Delete group?')) return;
    this.groupService.deleteGroup(this.group.id).subscribe({ next: () => this.router.navigate(['/admin/groups']), error: e => console.error(e) });
  }

  edit() {
    if (!this.group) return;
    this.router.navigate(['/admin/groups', this.group.id, 'edit']);
  }

  removeMember(userId: string) {
    if (!this.group) return;
    if (!confirm('Are you sure you want to remove this member?')) return;
    this.groupService.removeMember(this.group.id, userId).subscribe({
      next: () => {
        this.groupService.getGroupMembers(this.group.id).subscribe({
          next: m => this.members = m,
          error: e => console.error('Failed load members', e)
        });
      },
      error: e => console.error(e)
    });
  }

  approveMember(userId: string) {
    if (!this.group) return;
    this.groupService.approveMember(this.group.id, userId).subscribe({
      next: () => {
        this.groupService.getGroupMembers(this.group.id).subscribe({
          next: m => this.members = m,
          error: e => console.error('Failed load members', e)
        });
      },
      error: e => console.error(e)
    });
  }

  rejectMember(userId: string) {
    if (!this.group) return;
    if (!confirm('Reject this membership request?')) return;
    this.groupService.rejectMember(this.group.id, userId).subscribe({
      next: () => {
        this.groupService.getGroupMembers(this.group.id).subscribe({
          next: m => this.members = m,
          error: e => console.error('Failed load members', e)
        });
      },
      error: e => console.error(e)
    });
  }

  setGroupStatus(status: string) {
    if (!this.group) return;
    if (!confirm(`Change group status to ${status}?`)) return;
    this.groupService.setGroupStatus(this.group.id, status as any).subscribe({
      next: () => this.loadGroup(this.group.id),
      error: e => console.error(e)
    });
  }
}
