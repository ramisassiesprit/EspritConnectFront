import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../../core/services/User.service';
import { User, UserStatus } from '../../../../core/models/user.model';
import { UserRole } from '../../../../core/models/user-role.enum';

@Component({
  selector: 'app-admin-approval',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './approval.component.html',
  styleUrl: './approval.component.css'
})
export class ApprovalComponent implements OnInit {
  private userService = inject(UserService);

  users: User[] = [];
  selectedRole: UserRole = UserRole.ETUDIANT;
  loading = false;

  roles = Object.values(UserRole);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.userService.getUsersByRole(this.selectedRole).subscribe({
      next: (users) => {
        this.users = users.filter(u => u.status === UserStatus.PENDING);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading pending users', err);
        this.loading = false;
      }
    });
  }

  onRoleChange() {
    this.loadUsers();
  }

  acceptUser(userId: string) {
    this.userService.updateUserStatus(userId, UserStatus.ACTIVE).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => console.error('Error accepting user', err)
    });
  }

  rejectUser(userId: string) {
    this.userService.updateUserStatus(userId, UserStatus.REJECTED).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => console.error('Error rejecting user', err)
    });
  }
}
