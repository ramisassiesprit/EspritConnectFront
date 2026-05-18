import { Component, signal, inject, effect, HostListener, ElementRef } from '@angular/core';
import { RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { UserService } from '../core/services/User.service';
import { User } from '../core/models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private el = inject(ElementRef);
  private route = inject(ActivatedRoute);

  isLoggedIn = this.authService.isLoggedIn;
  showJoinModal = signal(false);
  showLoginModal = signal(false);
  notifCount = signal(0);
  msgCount = signal(0);
  showProfileMenu = signal(false);
  currentUser = signal<User | null>(null);

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.showProfileMenu() && !this.el.nativeElement.contains(event.target)) {
      this.showProfileMenu.set(false);
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
      } else {
        this.currentUser.set(null);
      }
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
