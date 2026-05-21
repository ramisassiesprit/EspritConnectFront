import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../navbar/navbar.component';

@Component({
  selector: 'app-entreprise-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, NavbarComponent],
  templateUrl: './entreprise-shell.component.html',
  styleUrl: './entreprise-shell.component.css'
})
export class EntrepriseShellComponent {
  readonly menu = [
    {
      label: 'Jobs',
      icon: 'business_center',
      description: 'Create and manage your offers',
      link: '/entreprise/jobs'
    },
    {
      label: 'Mon profil',
      icon: 'person',
      description: 'Update your personal information',
      link: '/entreprise/profile'
    },
    {
      label: 'Parametres',
      icon: 'settings',
      description: 'Mentoring and preferences settings',
      link: '/entreprise/settings'
    }
  ];
}
