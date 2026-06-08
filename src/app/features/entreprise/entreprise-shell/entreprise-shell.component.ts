import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../navbar/navbar.component';

@Component({
  selector: 'app-entreprise-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, NavbarComponent],
  templateUrl: './entreprise-shell.component.html',
  styleUrl: './entreprise-shell.component.css'
})
export class EntrepriseShellComponent {
  private router = inject(Router);

  isStudentView = localStorage.getItem('viewMode') === 'etudiant';

  switchView() {
    if (this.isStudentView) {
      this.isStudentView = false;
      localStorage.removeItem('viewMode');
      this.router.navigate(['/entreprise/jobs']);
    } else {
      this.isStudentView = true;
      localStorage.setItem('viewMode', 'etudiant');
      this.router.navigate(['/etudiant/feed']);
    }
  }
  readonly menu = [
    {
      label: 'Jobs',
      icon: 'business_center',
      description: 'Create and manage your offers',
      link: '/entreprise/jobs'
    },
    {
      label: 'Recommandations',
      icon: 'star',
      description: 'Discover top matching talent',
      link: '/entreprise/recommendations'
    },
    {
      label: 'Mini-ATS',
      icon: 'view_kanban',
      description: 'Suivi de vos candidats IA',
      link: '/entreprise/ats-board'
    },
    {
      label: 'Talent Insights',
      icon: 'insights',
      description: 'Tendances et statistiques',
      link: '/entreprise/insights'
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
