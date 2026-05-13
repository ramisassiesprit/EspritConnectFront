import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface SubItem {
  label: string;
  route: string;
}

interface NavItem {
  label: string;
  icon: string;
  route: string;
  hasChevron?: boolean;
  subItems?: SubItem[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-etudiant-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  navItems: NavItem[] = [
    { label: 'Home', icon: 'home', route: '/etudiant/home' },
    { label: 'Feed', icon: 'feed', route: '/etudiant/feed' },
    { label: 'Directory', icon: 'folder', route: '/etudiant/directory' },
    { 
      label: 'Mentoring', 
      icon: 'group', 
      route: '/etudiant/mentoring', 
      hasChevron: true,
      isOpen: false,
      subItems: [
        { label: 'Find a Mentor', route: '/etudiant/mentoring/find' },
        { label: 'Mentoring Relationships', route: '/etudiant/mentoring/relationships' },
        { label: 'Settings', route: '/etudiant/mentoring/settings' }
      ]
    },
    { 
      label: 'Jobs', 
      icon: 'business_center', 
      route: '/etudiant/jobs', 
      hasChevron: true,
      isOpen: false,
      subItems: [
        { label: 'Job Board', route: '/etudiant/jobs/board' }
      ]
    },
    { label: 'Photos', icon: 'image', route: '/etudiant/photos' },
    { label: 'Groups', icon: 'groups', route: '/etudiant/groups' },
    { 
      label: 'Events', 
      icon: 'event', 
      route: '/etudiant/events', 
      hasChevron: true,
      isOpen: false, 
      subItems: [
        { label: 'Event Board', route: '/etudiant/events/board' },
        { label: 'Post an Event', route: '/etudiant/events/post' }
      ]
    },
    { label: 'Resources', icon: 'description', route: '/etudiant/resources' },
    { 
      label: 'Info & Support', 
      icon: 'info', 
      route: '/etudiant/info-support', 
      hasChevron: true,
      isOpen: false,
      subItems: [
        { label: 'Terms of use', route: '/etudiant/info-support/terms' },
        { label: 'Privacy policy', route: '/etudiant/info-support/privacy' },
        { label: 'Technical Support', route: '/etudiant/info-support/tech' },
        { label: 'Submit a ticket', route: '/etudiant/info-support/ticket' }
      ]
    }
  ];

  toggleItem(item: NavItem) {
    if (item.subItems) {
      item.isOpen = !item.isOpen;
    }
  }
}
