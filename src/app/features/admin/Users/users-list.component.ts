import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/User.service';
import { User, UserStatus } from '../../../core/models/user.model';
import { UserRole } from '../../../core/models/user-role.enum';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent implements OnInit {
  private adminService = inject(UserService);

  users: User[] = [];
  selectedRole: UserRole = UserRole.ETUDIANT;
  loading = false;

  roles = Object.values(UserRole);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.adminService.getUsersByRole(this.selectedRole).subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users', err);
        this.loading = false;
      }
    });
  }

  onRoleChange() {
    this.loadUsers();
  }

  acceptUser(userId: string) {
    this.adminService.updateUserStatus(userId, UserStatus.ACTIVE).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => console.error('Error accepting user', err)
    });
  }

  rejectUser(userId: string) {
    this.adminService.updateUserStatus(userId, UserStatus.REJECTED).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => console.error('Error rejecting user', err)
    });
  }

  getStatusClass(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE: return 'status-active';
      case UserStatus.PENDING: return 'status-pending';
      case UserStatus.REJECTED: return 'status-rejected';
      default: return '';
    }
  }
}
