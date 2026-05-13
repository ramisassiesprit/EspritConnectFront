import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../core/services/User.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-my-community',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-community.component.html',
  styleUrl: './my-community.component.css'
})
export class MyCommunityComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  
  onlineUsers: User[] = [];
  private refreshInterval: any;

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadOnlineUsers();
    }
    
    // Refresh every 30 seconds, only if logged in
    this.refreshInterval = setInterval(() => {
      if (this.authService.isLoggedIn()) {
        this.loadOnlineUsers();
      }
    }, 30000);
  }

  loadOnlineUsers(): void {
    this.userService.getOnlineUsers().subscribe({
      next: (users) => {
        this.onlineUsers = users;
      },
      error: (err) => {
        console.error('Error fetching online users', err);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}
