import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  route?: string;
  children?: { label: string; route: string }[];
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent {
  private router = inject(Router);

  isStudentView = localStorage.getItem('viewMode') === 'etudiant';

  expandedGroup: string | null = 'Jobs';

  switchView() {
    if (this.isStudentView) {
      this.isStudentView = false;
      localStorage.removeItem('viewMode');
      this.router.navigate(['/admin/home']);
    } else {
      this.isStudentView = true;
      localStorage.setItem('viewMode', 'etudiant');
      this.router.navigate(['/etudiant/feed']);
    }
  }

  toggleGroup(label: string) {
    this.expandedGroup = this.expandedGroup === label ? null : label;
  }

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/admin/home' },
    {
      label: 'User Management',
      children: [
        { label: 'Approval', route: '/admin/users/approval' },
        { label: 'Affiliations', route: '/admin/users/affiliations' },
        { label: 'By Role', route: '/admin/users/by-role' },
        { label: 'Mailing', route: '/admin/users/mailing' }
      ]
    },
    { label: 'Feed', route: '/admin/feed' },
    { label: 'Directory', route: '/admin/directory' },
    { label: 'Mentoring', route: '/admin/mentoring' },
    {
      label: 'Jobs',
      children: [
        { label: 'Settings', route: '/admin/jobs/settings' },
        { label: 'Import Jobs', route: '/admin/jobs/import' },
        { label: 'Manage Jobs', route: '/admin/jobs/manage' }
      ]
    },
    { label: 'Photos', route: '/admin/photos' },
    { label: 'Groups', route: '/admin/groups' },
    { label: 'Events', route: '/admin/events' },
    { label: 'Resources', route: '/admin/resources' },
    {
      label: 'Settings',
      children: [
        { label: 'Homepage Settings', route: '/admin/settings/homepage' },
        { label: 'Mailing Settings', route: '/admin/settings/mailing' }
      ]
    }
  ];
}
