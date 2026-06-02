import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { EnseignantSidebarComponent } from '../enseignant-sidebar/enseignant-sidebar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-enseignant-shell',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, EnseignantSidebarComponent, CommonModule],
  templateUrl: './enseignant-shell.component.html',
  styleUrls: ['./enseignant-shell.component.css']
})
export class EnseignantShellComponent {
  isHomePage = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isHomePage = event.urlAfterRedirects === '/enseignant/home' || event.urlAfterRedirects === '/enseignant';
    });
  }
}
