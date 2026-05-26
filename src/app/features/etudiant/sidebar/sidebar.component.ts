import { Component, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { GroupService } from '../../../core/services/group.service';
import { AuthService } from '../../../core/services/auth.service';
import { Group } from '../../../core/models/group.model';

interface SubItem {
  label: string;
  route: string;
  queryParams?: Record<string, string>;
}

interface NavItem {
  label: string;
  icon: string;
  route: string;
  hasChevron?: boolean;
  subItems?: SubItem[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-etudiant-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private router = inject(Router);

  joinedGroups: Group[] = [];
  private membershipSub?: Subscription;
  private routerEventsSub?: Subscription;

  navItems: NavItem[] = [
    { label: 'Home', icon: 'home', route: '/etudiant/home' },
    { label: 'Feed', icon: 'feed', route: '/etudiant/feed' },
    { label: 'Directory', icon: 'folder', route: '/etudiant/directory' },
    {
      label: 'Mentoring',
      icon: 'group',
      route: '/etudiant/mentoring',
      hasChevron: true,
      isOpen: false,
      subItems: [
        { label: 'Find a Mentor', route: '/etudiant/mentoring/find' },
        { label: 'Mentoring Relationships', route: '/etudiant/mentoring/relations' },
        { label: 'Settings', route: '/etudiant/mentoring/settings' }
      ]
    },
    {
      label: 'Jobs',
      icon: 'business_center',
      route: '/etudiant/jobs',
      hasChevron: true,
      isOpen: false,
      subItems: [
        { label: 'Job Board', route: '/etudiant/jobs/board' }
      ]
    },
    { label: 'Photos', icon: 'image', route: '/etudiant/photos' },
    {
      label: 'Groups',
      icon: 'groups',
      route: '/etudiant/groups',
      hasChevron: true,
      isOpen: false,
      subItems: []
    },
    {
      label: 'Events',
      icon: 'event',
      route: '/etudiant/events',
      hasChevron: true,
      isOpen: false,
      subItems: [
        { label: 'Event Board', route: '/etudiant/events/board' },
        { label: 'Post an Event', route: '/etudiant/events/post' }
      ]
    },
    { label: 'Resources', icon: 'description', route: '/etudiant/resources' },
    {
      label: 'Info & Support',
      icon: 'info',
      route: '/etudiant/info-support',
      hasChevron: true,
      isOpen: false,
      subItems: [
        { label: 'Terms of use', route: '/etudiant/info-support/terms' },
        { label: 'Privacy policy', route: '/etudiant/info-support/privacy' },
        { label: 'Technical Support', route: '/etudiant/info-support/tech' },
        { label: 'Submit a ticket', route: '/etudiant/info-support/ticket' }
      ]
    }
  ];

  constructor() {
    // Use effect to react to changes in currentUser signal
    effect(() => {
      const session = this.authService.currentUser();
      if (session?.userId) {
        this.loadJoinedGroups(session.userId);
      }
    });

    this.syncOpenState(this.router.url);
    this.routerEventsSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.syncOpenState(event.urlAfterRedirects));
  }

  ngOnInit() {
    this.membershipSub = this.groupService.membershipChanged$.subscribe(() => {
      const session = this.authService.currentUser();
      if (session?.userId) {
        this.loadJoinedGroups(session.userId);
      }
    });
  }

  ngOnDestroy() {
    this.membershipSub?.unsubscribe();
    this.routerEventsSub?.unsubscribe();
  }

  private loadJoinedGroups(userId: string) {
    this.groupService.getUserGroups(userId).subscribe(groups => {
      this.joinedGroups = groups;
      this.syncGroupSubItems();
    });
  }

  private syncGroupSubItems() {
    const groupsItem = this.navItems.find(item => item.label === 'Groups');
    if (!groupsItem) return;

    groupsItem.subItems = this.joinedGroups.length
      ? this.joinedGroups.map(group => ({
        label: group.groupName,
        route: `/etudiant/groups/${group.id}/feed`
      }))
      : [];

    this.syncOpenState(this.router.url);
  }

  private syncOpenState(url: string) {
    const normalizedUrl = url.split('?')[0].split('#')[0];

    this.navItems.forEach(item => {
      if (!item.subItems?.length) {
        return;
      }

      const isBaseRouteActive =
        normalizedUrl === item.route || normalizedUrl.startsWith(`${item.route}/`);
      const isSubRouteActive = item.subItems.some(
        subItem => normalizedUrl === subItem.route || normalizedUrl.startsWith(`${subItem.route}/`)
      );

      item.isOpen = isBaseRouteActive || isSubRouteActive;
    });
  }

  toggleItem(item: NavItem) {
    if (item.subItems) {
      item.isOpen = !item.isOpen;
    }
  }
}
