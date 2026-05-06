import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent {
  menuItems = [
    {
      label: 'Utilisateurs',
      icon: 'bi-people',
      route: '/admin/users'
    },
    {
      label: 'Statistiques',
      icon: 'bi-graph-up',
      route: '/admin/stats'
    },
    {
      label: 'Paramètres',
      icon: 'bi-gear',
      route: '/admin/settings'
    }
  ];
}
