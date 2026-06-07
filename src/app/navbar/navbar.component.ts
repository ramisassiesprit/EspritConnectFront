import { Component, signal, computed, inject, effect, HostListener, ElementRef, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { RouterLink, RouterLinkActive, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { UserService } from '../core/services/User.service';
import { User } from '../core/models/user.model';
import { NotificationService } from '../core/services/notification.service';
import { Notification } from '../core/models/notification.model';
import { Subscription, filter } from 'rxjs';

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
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy, AfterViewInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private el = inject(ElementRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private navbarEl: HTMLElement | null = null;
  private navbarContainerEl: HTMLElement | null = null;
  private navbarBrandEl: HTMLElement | null = null;
  private navbarActionsEl: HTMLElement | null = null;
  contentWrapped = signal(false);
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
        { label: 'Job Board', route: '/etudiant/jobs/board' },
        { label: 'Mock Interview (IA)', route: '/etudiant/mock-interview' }
      ]
    },
    { label: 'Photos', icon: 'image', route: '/etudiant/photos' },
    {
      label: 'Groups',
      icon: 'groups',
      route: '/etudiant/groups'
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
    { label: 'Pour Vous', icon: 'auto_awesome', route: '/etudiant/recommendations' },
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

  isAdminView(): boolean {
    return this.router.url.startsWith('/admin');
  }

  switchToUserView() {
    this.router.navigate(['/etudiant/home']);
  }

  switchToAdminView() {
    this.router.navigate(['/admin/users']);
  }

  isLoggedIn = this.authService.isLoggedIn;
  showJoinModal = signal(false);
  showLoginModal = signal(false);
  notifCount = signal(0);
  msgCount = signal(0);
  showProfileMenu = signal(false);
  showNotifDropdown = signal(false);
  showMeetingsDropdown = signal(false);
  currentUser = signal<User | null>(null);
  notifications = signal<Notification[]>([]);
  
  // Exclude video chat URLs from regular notifications
  regularNotifications = computed(() => {
    return this.notifications().filter(n => n.targetType !== 'VIDEO_CHAT_URL');
  });

  // Extract meetings from notifications
  meetings = computed(() => {
    return this.notifications()
      .filter(n => n.targetType === 'VIDEO_CHAT_URL')
      .map(n => {
        // Parse date from body "at YYYY-MM-DDTHH:mm"
        const dateMatch = n.body?.match(/at\s(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
        const urlMatch = n.body?.match(/Link:\s*(https?:\/\/[^\s]+)/);
        
        let scheduledDate = new Date();
        if (dateMatch) {
          scheduledDate = new Date(dateMatch[1]);
        }
        
        const now = new Date();
        const diffTime = scheduledDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isExpired = diffTime < 0 && Math.abs(diffTime) > 60 * 60 * 1000; // Expired 1 hour after scheduled time
        
        let url = '';
        if (urlMatch) {
          url = urlMatch[1];
        }
        
        return {
          id: n.id,
          title: n.title,
          scheduledDate,
          daysLeft,
          isExpired,
          url,
          isRead: n.isRead,
          createdAt: n.createdAt
        };
      })
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  });

  unreadMeetingsCount = computed(() => {
    return this.meetings().filter(m => !m.isRead).length;
  });

  private pollInterval: any;
  private liveNotificationSub?: Subscription;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.showProfileMenu() && !this.el.nativeElement.contains(event.target)) {
      this.showProfileMenu.set(false);
    }
    if (this.showNotifDropdown() && !this.el.nativeElement.contains(event.target)) {
      this.showNotifDropdown.set(false);
    }
    if (this.showMeetingsDropdown() && !this.el.nativeElement.contains(event.target)) {
      this.showMeetingsDropdown.set(false);
    }
  }

  constructor() {
    this.syncOpenState(this.router.url);
    this.routerEventsSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.syncOpenState(event.urlAfterRedirects));

    this.route.queryParams.subscribe(params => {
      if (params['login'] === 'true') {
        this.showLoginModal.set(true);
      }
    });

    effect(() => {
      if (this.isLoggedIn()) {
        this.userService.getCurrentUser().subscribe({
          next: (user) => {
            this.currentUser.set(user);
            this.loadNotifications();
            this.connectNotificationStream(user.id);
            this.startNotificationPolling();
          },
          error: (err) => console.error('Failed to fetch user profile', err)
        });
      } else {
        this.currentUser.set(null);
        this.notifications.set([]);
        this.notifCount.set(0);
        this.disconnectNotificationStream();
        this.stopNotificationPolling();
      }
    });
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    try {
      this.navbarEl = this.el.nativeElement.querySelector('.navbar');
      this.navbarContainerEl = this.el.nativeElement.querySelector('.navbar__container');
      this.navbarBrandEl = this.el.nativeElement.querySelector('.navbar__brand');
      this.navbarActionsEl = this.el.nativeElement.querySelector('.navbar__actions');
      // initial evaluation
      setTimeout(() => this.evaluateLayout(), 50);
    } catch (e) {
      // ignore
    }
  }

  ngOnDestroy() {
    this.routerEventsSub?.unsubscribe();
    this.disconnectNotificationStream();
    this.stopNotificationPolling();
  }

  private startNotificationPolling() {
    this.stopNotificationPolling();
    this.pollInterval = setInterval(() => this.loadNotifications(), 10000);
  }

  private stopNotificationPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private connectNotificationStream(userId: string) {
    this.disconnectNotificationStream();
    this.notificationService.connectToNotifications(userId);
    this.liveNotificationSub = this.notificationService.getLiveNotifications().subscribe(() => {
      this.loadNotifications();
    });
  }

  private disconnectNotificationStream() {
    this.liveNotificationSub?.unsubscribe();
    this.liveNotificationSub = undefined;
    this.notificationService.disconnectNotifications();
  }

  loadNotifications() {
    if (this.isLoggedIn()) {
      this.notificationService.getNotifications().subscribe({
        next: (notifs) => {
          this.notifications.set(notifs);
          this.notifCount.set(this.regularNotifications().filter(n => !n.isRead).length);
        },
        error: (err) => console.error('Failed to load notifications', err)
      });
    }
  }

  toggleNotifDropdown() {
    this.showNotifDropdown.update(v => !v);
    if (this.showNotifDropdown()) {
      this.showProfileMenu.set(false);
      this.showMeetingsDropdown.set(false);
    }
  }

  toggleMeetingsDropdown() {
    this.showMeetingsDropdown.update(v => !v);
    if (this.showMeetingsDropdown()) {
      this.showProfileMenu.set(false);
      this.showNotifDropdown.set(false);
    }
  }

  markNotificationAsRead(notif: Notification, event: Event) {
    event.stopPropagation();
    this.notificationService.markAsRead(notif.id).subscribe(() => {
      this.loadNotifications();
    });
  }

  markMeetingAsRead(meeting: any, event: Event) {
    event.stopPropagation();
    this.notificationService.markAsRead(meeting.id).subscribe(() => {
      this.loadNotifications();
    });
  }

  getNotificationLink(notif: Notification): string | null {
    if (notif.targetType === 'EVENT') {
      return '/etudiant/events';
    }

    if (notif.targetType === 'MENTORSHIP_REQUEST') {
      return '/etudiant/mentoring/relations';
    }

    if (notif.type === 'MENTORING_REQUEST' || notif.type === 'MENTORING_ACCEPTED' || notif.type === 'MENTORING_REJECTED') {
      return '/etudiant/mentoring/relations';
    }

    return null;
  }

  onNotificationClick(notif: Notification, event: Event) {
    if (this.showNotifDropdown()) {
        this.showNotifDropdown.set(false);
    }
    
    const link = this.getNotificationLink(notif);
    if (link) {
      this.router.navigate([link]);
    }
  }

  onMeetingClick(meeting: any, event: Event) {
    if (this.showMeetingsDropdown()) {
        this.showMeetingsDropdown.set(false);
    }
    
    // Mark as read
    if (!meeting.isRead) {
      this.notificationService.markAsRead(meeting.id).subscribe(() => {
        this.loadNotifications();
      });
    }

    if (meeting.url) {
      const now = new Date();
      // Allow joining 10 minutes before the scheduled time
      const allowJoinTime = new Date(meeting.scheduledDate.getTime() - 10 * 60000);

      if (now < allowJoinTime) {
        const formattedTime = meeting.scheduledDate.toLocaleString('fr-FR', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
        alert(`⚠️ The meeting cannot be joined yet.\n\nIt is scheduled for: ${formattedTime}.\nPlease come back 10 minutes before the meeting starts.`);
        return;
      }
      
      window.open(meeting.url, '_blank');
    }
  }

  markAllNotificationsAsRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.loadNotifications();
    });
  }

  get homeLink() {
    return this.authService.getHomePath();
  }

  get profileLink() {
    return `${this.homeLink}/profile`;
  }

  get settingsLink() {
    return `${this.homeLink}/settings`;
  }

  get initials() {
    const user = this.currentUser();
    if (!user) return '??';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }

  loginData = {
    email: '',
    password: ''
  };

  forgotPasswordMode = signal(false);
  forgotPasswordSuccess = signal(false);
  forgotPasswordEmail = signal('');
  forgotPasswordLoading = signal(false);
  forgotPasswordError = signal('');
  // Mobile menu state
  mobileMenuOpen = signal(false);

  toggleForgotPasswordMode(val: boolean) {
    this.forgotPasswordMode.set(val);
    this.forgotPasswordSuccess.set(false);
    this.forgotPasswordEmail.set('');
    this.forgotPasswordError.set('');
    this.forgotPasswordLoading.set(false);
  }

  onSendForgotPassword() {
    const email = this.forgotPasswordEmail().trim();
    if (!email) {
      this.forgotPasswordError.set("L'adresse e-mail est requise");
      return;
    }

    this.forgotPasswordLoading.set(true);
    this.forgotPasswordError.set('');

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.forgotPasswordLoading.set(false);
        this.forgotPasswordSuccess.set(true);
      },
      error: (err) => {
        this.forgotPasswordLoading.set(false);
        this.forgotPasswordError.set(err.error?.message || "L'adresse email n'a pas été trouvée");
        console.error('Forgot password failed', err);
      }
    });
  }

  toggleProfileMenu() {
    this.showProfileMenu.update(v => !v);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
    if (this.mobileMenuOpen()) {
      // close other dropdowns for clarity
      this.showProfileMenu.set(false);
      this.showNotifDropdown.set(false);
      this.showMeetingsDropdown.set(false);
      this.navbarEl?.classList.add('mobile-menu-open');
    }
    else {
      this.navbarEl?.classList.remove('mobile-menu-open');
    }
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  toggleNavItem(item: NavItem) {
    if (item.subItems) {
      item.isOpen = !item.isOpen;
    }
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

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    // auto-close mobile menu when switching to larger screens
    try {
      const w = event.target.innerWidth || window.innerWidth;
      if (w > 768 && this.mobileMenuOpen()) {
        this.mobileMenuOpen.set(false);
      }
      // re-evaluate wrapping/layout
      this.evaluateLayout();
    } catch (e) {
      // ignore
    }
  }

  evaluateLayout() {
    try {
      if (!this.navbarContainerEl || !this.navbarBrandEl || !this.navbarActionsEl) return;

      // Calculate vertical centers of brand and actions
      const brandCenter = this.navbarBrandEl.offsetTop + this.navbarBrandEl.offsetHeight / 2;
      const actionsCenter = this.navbarActionsEl.offsetTop + this.navbarActionsEl.offsetHeight / 2;

      // If actions are physically on a line below the brand (wrapped)
      const wrapped = this.navbarBrandEl.offsetHeight > 0 && 
                      this.navbarActionsEl.offsetHeight > 0 && 
                      (actionsCenter - brandCenter > 15);

      this.contentWrapped.set(wrapped);

      // Toggle a global class so CSS can react regardless of media queries
      if (wrapped) {
        document.body.classList.add('mobile-mode');
        this.navbarEl?.classList.add('mobile-mode');
      } else {
        document.body.classList.remove('mobile-mode');
        this.navbarEl?.classList.remove('mobile-mode');
      }
    } catch (e) {
      // ignore layout errors
    }
  }

  toggleJoinModal() {
    this.showJoinModal.update(v => !v);
  }

  toggleLoginModal() {
    this.showLoginModal.update(v => !v);
    if (!this.showLoginModal()) {
      this.toggleForgotPasswordMode(false);
    }
  }

  onLogin() {
    if (this.loginData.email && this.loginData.password) {
      this.authService.login(this.loginData).subscribe({
        next: () => {
          this.showLoginModal.set(false);
        },
        error: (err) => {
          console.error('Login failed', err);
          // In a real app, show a toast or error message
        }
      });
    }
  }

  onLogout() {
    this.authService.logout();
    this.showProfileMenu.set(false);
  }
}
