import { Component, signal, inject, effect } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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

  isLoggedIn = this.authService.isLoggedIn;
  showJoinModal = signal(false);
  showLoginModal = signal(false);
  notifCount = signal(3);
  msgCount = signal(5);
  showProfileMenu = signal(false);
  currentUser = signal<User | null>(null);

  constructor() {
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

  get initials() {
    const user = this.currentUser();
    if (!user) return '??';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }

  loginData = {
    email: '',
    password: ''
  };

  toggleProfileMenu() {
    this.showProfileMenu.update(v => !v);
  }

  toggleJoinModal() {
    this.showJoinModal.update(v => !v);
  }

  toggleLoginModal() {
    this.showLoginModal.update(v => !v);
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
