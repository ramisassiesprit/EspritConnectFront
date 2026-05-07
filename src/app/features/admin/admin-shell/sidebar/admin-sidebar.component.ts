import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent {
  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/admin/home' },
    { label: 'Users', route: '/admin/users' },
    { label: 'Feed', route: '/admin/feed' },
    { label: 'Directory', route: '/admin/directory' },
    { label: 'Mentoring', route: '/admin/mentoring' },
    { label: 'Jobs', route: '/admin/jobs' },
    { label: 'Photos', route: '/admin/photos' },
    { label: 'Groups', route: '/admin/groups' },
    { label: 'Events', route: '/admin/events' },
    { label: 'Resources', route: '/admin/resources' },
    { label: 'Settings', route: '/admin/settings' }
  ];
}
