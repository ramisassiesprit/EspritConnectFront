import { Component, signal, inject, effect, HostListener, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { UserService } from '../core/services/User.service';
import { User } from '../core/models/user.model';
import { NotificationService } from '../core/services/notification.service';
import { Notification } from '../core/models/notification.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private el = inject(ElementRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

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
  currentUser = signal<User | null>(null);
  notifications = signal<Notification[]>([]);
  private pollInterval: any;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.showProfileMenu() && !this.el.nativeElement.contains(event.target)) {
      this.showProfileMenu.set(false);
    }
    if (this.showNotifDropdown() && !this.el.nativeElement.contains(event.target)) {
      this.showNotifDropdown.set(false);
    }
  }

  constructor() {
    this.route.queryParams.subscribe(params => {
      if (params['login'] === 'true') {
        this.showLoginModal.set(true);
      }
    });

    effect(() => {
      if (this.isLoggedIn()) {
        this.userService.getCurrentUser().subscribe({
          next: (user) => this.currentUser.set(user),
          error: (err) => console.error('Failed to fetch user profile', err)
        });
        this.loadNotifications();
      } else {
        this.currentUser.set(null);
        this.notifications.set([]);
        this.notifCount.set(0);
      }
    });
  }

  ngOnInit() {
    if (this.isLoggedIn()) {
      this.loadNotifications();
      this.pollInterval = setInterval(() => this.loadNotifications(), 10000);
    }
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  loadNotifications() {
    if (this.isLoggedIn()) {
      this.notificationService.getNotifications().subscribe({
        next: (notifs) => {
          this.notifications.set(notifs);
          this.notifCount.set(notifs.filter(n => !n.isRead).length);
        },
        error: (err) => console.error('Failed to load notifications', err)
      });
    }
  }

  toggleNotifDropdown() {
    this.showNotifDropdown.update(v => !v);
    if (this.showNotifDropdown()) {
      this.showProfileMenu.set(false);
    }
  }

  markNotificationAsRead(notif: Notification, event: Event) {
    event.stopPropagation();
    this.notificationService.markAsRead(notif.id).subscribe(() => {
      this.loadNotifications();
    });
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
