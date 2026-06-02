import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { AncienSidebarComponent } from '../ancien-sidebar/ancien-sidebar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-ancien-shell',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, AncienSidebarComponent, CommonModule],
  templateUrl: './ancien-shell.component.html',
  styleUrls: ['./ancien-shell.component.css']
})
export class AncienShellComponent {
  isHomePage = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isHomePage = event.urlAfterRedirects === '/ancien/home' || event.urlAfterRedirects === '/ancien';
    });
  }
}
