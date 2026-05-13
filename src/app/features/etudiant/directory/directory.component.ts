import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/User.service';
import { User } from '../../../core/models/user.model';
import { UserRole } from '../../../core/models/user-role.enum';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-directory',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './directory.component.html',
  styleUrl: './directory.component.css'
})
export class DirectoryComponent implements OnInit {
  private userService = inject(UserService);

  allUsers: User[] = [];
  filteredUsers: User[] = [];
  
  // Search and Tabs
  searchQuery: string = '';
  activeTab: 'all' | 'location' | 'mentors' = 'all';
  
  // Sidebar Filters
  filters = {
    firstName: '',
    lastName: '',
    affiliation: ''
  };

  sortBy: 'alphabetical' | 'recent' = 'alphabetical';
  
  roles = [
    { label: 'Student', value: UserRole.ETUDIANT },
    { label: 'Alumni', value: UserRole.ALUMNI },
    { label: 'Teacher/Staff', value: UserRole.ENSEIGNANT },
    { label: 'Company', value: UserRole.ENTREPRISE }
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getDirectoryUsers().subscribe(users => {
      this.allUsers = users;
      this.applyFilters();
    });
  }

  applyFilters(): void {
    let result = [...this.allUsers];

    // Search Query
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(u => 
        u.firstName.toLowerCase().includes(q) || 
        u.lastName.toLowerCase().includes(q)
      );
    }

    // Tabs
    if (this.activeTab === 'mentors') {
      result = result.filter(u => u.isMentor);
    }
    // Location tab logic would go here (need user location data)

    // Sidebar Filters
    if (this.filters.firstName) {
      result = result.filter(u => u.firstName.toLowerCase().includes(this.filters.firstName.toLowerCase()));
    }
    if (this.filters.lastName) {
      result = result.filter(u => u.lastName.toLowerCase().includes(this.filters.lastName.toLowerCase()));
    }
    if (this.filters.affiliation) {
      result = result.filter(u => u.role === this.filters.affiliation);
    }

    // Sorting
    if (this.sortBy === 'alphabetical') {
      result.sort((a, b) => a.lastName.localeCompare(b.lastName));
    } else {
      result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    this.filteredUsers = result;
  }

  resetFilters(): void {
    this.filters = {
      firstName: '',
      lastName: '',
      affiliation: ''
    };
    this.searchQuery = '';
    this.activeTab = 'all';
    this.applyFilters();
  }

  setTab(tab: 'all' | 'location' | 'mentors'): void {
    this.activeTab = tab;
    this.applyFilters();
  }
}
