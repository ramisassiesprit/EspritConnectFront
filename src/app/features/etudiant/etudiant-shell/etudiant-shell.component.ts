import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-etudiant-shell',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, CommonModule],
  templateUrl: './etudiant-shell.component.html',
  styleUrls: ['./etudiant-shell.component.css']
})
export class EtudiantShellComponent {
  isHomePage = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Check if current route is the student home page
      // Adjust the path according to your actual home route
      this.isHomePage = event.urlAfterRedirects === '/etudiant/home' || event.urlAfterRedirects === '/etudiant';
    });
  }
}
