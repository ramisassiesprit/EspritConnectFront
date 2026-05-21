import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupService } from '../../../../core/services/group.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Observable, forkJoin } from 'rxjs';
import { LucideAngularModule, Users, CheckCircle2, XCircle } from 'lucide-angular';

@Component({
  selector: 'app-group-requests',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './group-requests.component.html',
  styleUrls: ['./group-requests.component.css']
})
export class GroupRequestsComponent implements OnInit {
  private groupService = inject(GroupService);
  private authService = inject(AuthService);

  loading = false;
  ownerGroups: any[] = [];
  pendingByGroup: Record<string, any[]> = {};
  error = '';

  readonly Users = Users;
  readonly ApproveIcon = CheckCircle2;
  readonly RejectIcon = XCircle;

  ngOnInit() {
    this.loadOwnerPendingRequests();
  }

  private loadOwnerPendingRequests() {
    const userId = this.authService.currentUser()?.userId;
    if (!userId) return;
    this.loading = true;
    this.groupService.getUserGroups(userId).subscribe({
      next: (groups) => {
        // groups that current user created
        this.ownerGroups = (groups || []).filter((g: any) => String(g.creatorId) === String(userId));
        if (!this.ownerGroups.length) {
          this.loading = false;
          return;
        }

        // fetch members for each owned group
        const calls: Observable<any[]>[] = this.ownerGroups.map(g => this.groupService.getGroupMembers(g.id));
        forkJoin(calls).subscribe({
          next: (membersArrays) => {
            membersArrays.forEach((members, idx) => {
              const group = this.ownerGroups[idx];
              this.pendingByGroup[group.id] = (members || []).filter(m => m.status === 'PENDING');
            });
            this.loading = false;
          },
          error: (err) => {
            console.error('Failed to load group members', err);
            this.error = 'Failed to load pending requests.';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Failed to load user groups', err);
        this.error = 'Failed to load your groups.';
        this.loading = false;
      }
    });
  }

  approve(groupId: string, userId: string) {
    this.groupService.approveMember(groupId, userId).subscribe({
      next: (res) => {
        this.removePending(groupId, userId);
      },
      error: (err) => console.error('Approve failed', err)
    });
  }

  reject(groupId: string, userId: string) {
    this.groupService.rejectMember(groupId, userId).subscribe({
      next: () => this.removePending(groupId, userId),
      error: (err) => console.error('Reject failed', err)
    });
  }

  private removePending(groupId: string, userId: string) {
    const list = this.pendingByGroup[groupId] || [];
    this.pendingByGroup[groupId] = list.filter(m => String(m.userId || m.id) !== String(userId));
  }
}
