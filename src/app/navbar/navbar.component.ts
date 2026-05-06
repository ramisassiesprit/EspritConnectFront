import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  private authService = inject(AuthService);

  isLoggedIn = this.authService.isLoggedIn;
  showJoinModal = signal(false);
  showLoginModal = signal(false);
  notifCount = signal(3);
  msgCount = signal(5);
  showProfileMenu = signal(false);

  loginData = {
    email: '',
    password: ''
  };

  user = {
    name: 'Sassi',
    role: 'Étudiant',
    initials: 'S'
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
