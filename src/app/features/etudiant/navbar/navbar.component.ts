import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-etudiant-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  notifCount = signal(3);
  msgCount = signal(5);
  showProfileMenu = signal(false);

  user = {
    name: 'Sassi',
    role: 'Étudiant',
    initials: 'S'
  };

  toggleProfileMenu() {
    this.showProfileMenu.update(v => !v);
  }
}
