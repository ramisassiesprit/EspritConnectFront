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
  selector: 'app-enseignant-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './enseignant-sidebar.component.html',
  styleUrls: ['./enseignant-sidebar.component.css']
})
export class EnseignantSidebarComponent implements OnInit, OnDestroy {
  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private router = inject(Router);

  joinedGroups: Group[] = [];
  private membershipSub?: Subscription;
  private routerEventsSub?: Subscription;

  navItems: NavItem[] = [
    { label: 'Home', icon: 'home', route: '/enseignant/home' },
    { label: 'Feed', icon: 'feed', route: '/enseignant/feed' },
    { label: 'Directory', icon: 'folder', route: '/enseignant/directory' },
    {
      label: 'Groups (Classes)',
      icon: 'groups',
      route: '/enseignant/groups',
      hasChevron: true,
      isOpen: false,
      subItems: []
    },
    {
      label: 'Events',
      icon: 'event',
      route: '/enseignant/events',
      hasChevron: true,
      isOpen: false,
      subItems: [
        { label: 'Event Board', route: '/enseignant/events/board' },
        { label: 'Post an Event', route: '/enseignant/events/post' }
      ]
    },
    { label: 'Resources (Courses)', icon: 'description', route: '/enseignant/resources' },
    {
      label: 'Info & Support',
      icon: 'info',
      route: '/enseignant/info-support',
      hasChevron: true,
      isOpen: false,
      subItems: [
        { label: 'Terms of use', route: '/enseignant/info-support/terms' },
        { label: 'Privacy policy', route: '/enseignant/info-support/privacy' },
        { label: 'Technical Support', route: '/enseignant/info-support/tech' },
        { label: 'Submit a ticket', route: '/enseignant/info-support/ticket' }
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
    const groupsItem = this.navItems.find(item => item.label === 'Groups (Classes)');
    if (!groupsItem) return;

    groupsItem.subItems = this.joinedGroups.length
      ? this.joinedGroups.map(group => ({
        label: group.groupName,
        route: `/enseignant/groups/${group.id}/feed`
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
