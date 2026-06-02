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
  selector: 'app-ancien-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './ancien-sidebar.component.html',
  styleUrls: ['./ancien-sidebar.component.css']
})
export class AncienSidebarComponent implements OnInit, OnDestroy {
  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private router = inject(Router);

  joinedGroups: Group[] = [];
  private membershipSub?: Subscription;
  private routerEventsSub?: Subscription;

  navItems: NavItem[] = [
    { label: 'Home', icon: 'home', route: '/ancien/home' },
    { label: 'Feed', icon: 'feed', route: '/ancien/feed' },
    { label: 'Directory', icon: 'folder', route: '/ancien/directory' },
    {
      label: 'Mentoring',
      icon: 'group',
      route: '/ancien/mentoring',
      hasChevron: true,
      isOpen: false,
      subItems: [
        { label: 'Mentoring Relationships', route: '/ancien/mentoring/relations' },
        { label: 'Settings', route: '/ancien/mentoring/settings' }
      ]
    },
    {
      label: 'Jobs',
      icon: 'business_center',
      route: '/ancien/jobs',
      hasChevron: true,
      isOpen: false,
      subItems: [
        { label: 'Job Board', route: '/ancien/jobs/board' }
      ]
    },
    { label: 'Photos', icon: 'image', route: '/ancien/photos' },
    {
      label: 'Groups',
      icon: 'groups',
      route: '/ancien/groups',
      hasChevron: true,
      isOpen: false,
      subItems: []
    },
    {
      label: 'Events',
      icon: 'event',
      route: '/ancien/events',
      hasChevron: true,
      isOpen: false,
      subItems: [
        { label: 'Event Board', route: '/ancien/events/board' },
        { label: 'Post an Event', route: '/ancien/events/post' }
      ]
    },
    { label: 'Resources', icon: 'description', route: '/ancien/resources' },
    {
      label: 'Info & Support',
      icon: 'info',
      route: '/ancien/info-support',
      hasChevron: true,
      isOpen: false,
      subItems: [
        { label: 'Terms of use', route: '/ancien/info-support/terms' },
        { label: 'Privacy policy', route: '/ancien/info-support/privacy' },
        { label: 'Technical Support', route: '/ancien/info-support/tech' },
        { label: 'Submit a ticket', route: '/ancien/info-support/ticket' }
      ]
    }
  ];

  constructor() {
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
        route: `/ancien/groups/${group.id}/feed`
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
