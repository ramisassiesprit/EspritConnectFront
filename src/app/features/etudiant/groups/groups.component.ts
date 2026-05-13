import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { forkJoin, finalize, filter, Subscription } from 'rxjs';
import { GroupService } from '../../../core/services/group.service';
import { AuthService } from '../../../core/services/auth.service';
import { Group } from '../../../core/models/group.model';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Users, Plus, ChevronLeft, ChevronRight, LogOut, Info, UserPlus } from 'lucide-angular';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    LucideAngularModule
  ],
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit {

  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private router = inject(Router);

  joinedGroups: Group[] = [];
  allGroups: Group[] = [];
  availableLabels: string[] = [];
  selectedLabel: string | null = null;
  searchQuery: string = '';
  loading = false;
  error = '';
  isCreateRoute = false;
  isFeedRoute = false;
  private membershipSub?: Subscription;

  readonly Search = Search;
  readonly Users = Users;
  readonly Plus = Plus;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly LogOut = LogOut;
  readonly Info = Info;
  readonly UserPlus = UserPlus;

  ngOnInit() {
    this.updateRouteMode(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateRouteMode(event.urlAfterRedirects);
    });
    const session = this.authService.currentUser();
    if (!session?.userId) {
      this.error = 'Unable to load group data for the current user.';
      return;
    }

    this.loadGroups(session.userId);

    this.membershipSub = this.groupService.membershipChanged$.subscribe(() => {
      this.loadGroups(session.userId);
    });
  }

  ngOnDestroy() {
    this.membershipSub?.unsubscribe();
  }

  private loadGroups(userId: string) {
    this.loading = true;
    forkJoin({
      joined: this.groupService.getUserGroups(userId),
      all: this.groupService.getAllGroups()
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: ({ joined, all }) => {
          this.joinedGroups = joined.map(g => this.processGroupUrls(g));
          this.allGroups = all.map(g => this.processGroupUrls(g));
          this.extractLabels();
        },
        error: () => this.error = 'Failed to load groups. Please refresh the page.'
      });
  }

  private extractLabels() {
    const labelSet = new Set<string>();
    this.allGroups.forEach(group => {
      if (group.labels) {
        group.labels.split(',').forEach(l => {
          const trimmed = l.trim();
          if (trimmed) labelSet.add(trimmed);
        });
      }
    });
    this.availableLabels = Array.from(labelSet).sort();
  }

  selectLabel(label: string | null) {
    this.selectedLabel = label;
  }

  get filteredJoinedGroups(): Group[] {
    let filtered = this.joinedGroups;
    
    if (this.selectedLabel) {
      filtered = filtered.filter(g => 
        g.labels?.split(',').map(l => l.trim()).includes(this.selectedLabel!)
      );
    }
    
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(g => 
        g.groupName.toLowerCase().includes(q) || 
        g.description?.toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }

  get filteredAllGroups(): Group[] {
    // Exclude joined groups from "More Groups"
    const joinedIds = new Set(this.joinedGroups.map(g => g.id));
    let filtered = this.allGroups.filter(g => !joinedIds.has(g.id));
    
    if (this.selectedLabel) {
      filtered = filtered.filter(g => 
        g.labels?.split(',').map(l => l.trim()).includes(this.selectedLabel!)
      );
    }
    
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(g => 
        g.groupName.toLowerCase().includes(q) || 
        g.description?.toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }

  scrollGroups(direction: 'left' | 'right') {
    const container = document.querySelector('.your-groups-scroll-container');
    if (container) {
      const scrollAmount = 340; // Card width + gap
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  scrollLabels(direction: 'left' | 'right') {
    const container = document.querySelector('.labels-track');
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  private updateRouteMode(url: string) {
    this.isCreateRoute = url.endsWith('/create');
    // Check if we are in any of the group detail tabs
    this.isFeedRoute = url.includes('/feed') || 
                       url.includes('/members') || 
                       url.includes('/photos-albums') || 
                       url.includes('/events');
  }

  navigateToGroupFeed(groupId: string | number | undefined) {
    if (groupId) {
      this.router.navigate(['/etudiant/groups', groupId, 'feed']);
    }
  }

  joinGroup(event: Event, groupId: string | number | undefined) {
    event.stopPropagation();
    const userId = this.authService.currentUser()?.userId;
    if (!userId || !groupId) return;

    this.groupService.joinGroup(groupId.toString(), userId).subscribe({
      next: () => {
        // Service will trigger membershipChanged$
      },
      error: (err) => {
        console.error('Failed to join group', err);
        alert('Failed to join group. Please try again.');
      }
    });
  }

  leaveGroup(event: Event, groupId: string | number | undefined) {
    event.stopPropagation();
    if (!confirm('Are you sure you want to leave this group?')) return;
    
    const userId = this.authService.currentUser()?.userId;
    if (!userId || !groupId) return;

    this.groupService.exitGroup(groupId.toString(), userId).subscribe({
      next: () => {
        // Service will trigger membershipChanged$
      },
      error: (err) => {
        console.error('Failed to leave group', err);
        alert('Failed to leave group. Please try again.');
      }
    });
  }

  private processGroupUrls(group: Group): Group {
    const baseUrl = 'http://localhost:8086/EspritConnect/';
    return {
      ...group,
      logoUrl: group.logoUrl ? (group.logoUrl.startsWith('http') ? group.logoUrl : baseUrl + group.logoUrl) : 'assets/default-logo.png',
      bannerUrl: group.bannerUrl ? (group.bannerUrl.startsWith('http') ? group.bannerUrl : baseUrl + group.bannerUrl) : 'assets/default-banner.jpg'
    };
  }
}
