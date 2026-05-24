import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GroupService } from '../../../../core/services/group.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/User.service';
import { Group } from '../../../../core/models/group.model';
import { LucideAngularModule, ChevronDown, Info, Search, Users } from 'lucide-angular';

@Component({
  selector: 'app-group-details',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.css']
})
export class GroupDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private sanitizer = inject(DomSanitizer);

  groupId = '';
  group: Group | null = null;
  groupLoading = false;
  groupError = '';
  currentUser = this.authService.currentUser;
  isGroupMember = false;
  isMemberLoading = false;
  isRequestPending = false;
  owner: any = null;
  showFullDescription = false;
  descriptionLimit = 360; // characters before truncation
  private membershipSub?: Subscription;

  readonly ChevronDown = ChevronDown;
  readonly Info = Info;
  readonly Search = Search;
  readonly Users = Users;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== this.groupId) {
        this.groupId = id;
        this.loadGroup();
      }
    });

    // Only call checkMembership when membership changes from OTHER sources (like admin approval via WebSocket)
    // Don't rely on this after joinGroup() since we already set the state there
    this.membershipSub = this.groupService.membershipChanged$.subscribe(() => {
      // Only refresh if we were already a pending member (to detect approval)
      if (this.isRequestPending) {
        this.checkMembership();
      }
    });
  }

  stripHtml(html: string): string {
    return html ? html.replace(/<[^>]*>/g, '') : '';
  }

  getDescriptionHtml(): SafeHtml {
    const raw = this.group?.description || '';
    const text = this.stripHtml(raw).trim();
    if (this.showFullDescription || text.length <= this.descriptionLimit) {
      // show full description (escape is handled by sanitizer)
      return this.sanitizer.bypassSecurityTrustHtml(raw || 'No description provided.');
    }

    const truncated = text.slice(0, this.descriptionLimit).trim() + '...';
    const html = `<p>${truncated}</p>`;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  toggleDescription() {
    this.showFullDescription = !this.showFullDescription;
  }

  ngOnDestroy() {
    this.membershipSub?.unsubscribe();
  }

  private checkMembership() {
    const userId = this.currentUser()?.userId;
    if (!userId || !this.groupId) return;

    this.groupService.getUserGroups(userId).subscribe(groups => {
      const userGroupMembership = groups.find(g => g.id.toString() === this.groupId.toString());
      
      if (userGroupMembership) {
        // Check the membership status (cast to any to access runtime properties)
        const status = (userGroupMembership as any).status || (userGroupMembership as any).membershipStatus;
        
        // Only change state if we have an explicit status
        if (status === 'PENDING') {
          this.isRequestPending = true;
          this.isGroupMember = false;
        } else if (status === 'APPROVED') {
          this.isGroupMember = true;
          this.isRequestPending = false;
        }
        // If status is undefined/null and we're already pending, don't change it
        // This preserves the pending state until explicitly confirmed
      } else {
        // User is not in the group at all
        this.isGroupMember = false;
        this.isRequestPending = false;
      }
    });
  }

  loadGroup() {
    this.groupLoading = true;
    this.groupError = '';
    
    this.groupService.getGroupById(this.groupId).subscribe({
      next: (groupData) => {
        this.group = this.processGroupUrls(groupData);
        // load owner details for display when user is not a member
        if (this.group?.creatorId) {
          this.userService.getUserById(this.group.creatorId).subscribe({
            next: u => this.owner = u,
            error: () => this.owner = null
          });
        }
        this.checkMembership();
        this.groupLoading = false;
      },
      error: (error) => {
        console.error('Failed to load group:', error);
        this.groupError = 'Failed to load group details.';
        this.groupLoading = false;
      }
    });
  }

    get initials() {
    const user = this.currentUser();
    if (!user) return '??';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }
  
  private processGroupUrls(group: Group): Group {
    const baseUrl = 'http://localhost:8086/EspritConnect/';
    return {
      ...group,
      logoUrl: group.logoUrl ? (group.logoUrl.startsWith('http') ? group.logoUrl : baseUrl + group.logoUrl) : 'assets/default-logo.png',
      bannerUrl: group.bannerUrl ? (group.bannerUrl.startsWith('http') ? group.bannerUrl : baseUrl + group.bannerUrl) : 'assets/default-banner.jpg'
    };
  }

  joinGroup() {
    const userId = this.currentUser()?.userId;
    if (!userId) return;

    this.isMemberLoading = true;
    this.groupService.joinGroup(this.groupId).subscribe({
      next: (memberRes) => {
        // memberRes is GroupMemberDTO with possible status
        if (memberRes?.status === 'PENDING') {
          this.isRequestPending = true;
          this.isGroupMember = false;
        } else if (memberRes?.status === 'APPROVED') {
          this.isGroupMember = true;
          this.isRequestPending = false;
          // refresh group to get updated counts
          this.loadGroup();
        }
        this.isMemberLoading = false;
      },
      error: (error) => {
        console.error('Failed to join group:', error);
        this.isMemberLoading = false;
      }
    });
  }

  exitGroup() {
    if (!confirm('Are you sure you want to leave this group?')) return;

    const userId = this.currentUser()?.userId;
    if (!userId) return;

    this.isMemberLoading = true;
    this.groupService.exitGroup(this.groupId, userId).subscribe({
      next: () => {
        this.isGroupMember = false;
        this.isRequestPending = false;
        this.isMemberLoading = false;
      },
      error: (error) => {
        console.error('Failed to leave group:', error);
        this.isMemberLoading = false;
      }
    });
  }
}
