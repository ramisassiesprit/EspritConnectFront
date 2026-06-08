import { Component, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user-role.enum';

@Component({
  selector: 'app-etudiant-shell',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, CommonModule],
  templateUrl: './etudiant-shell.component.html',
  styleUrls: ['./etudiant-shell.component.css']
})
export class EtudiantShellComponent {
  isHomePage = false;
  private authService = inject(AuthService);

  /** True when a non-student role is browsing in "Vue Étudiant" mode */
  get isViewSwitchMode(): boolean {
    const role = this.authService.currentUser()?.role;
    const isViewMode = localStorage.getItem('viewMode') === 'etudiant';
    return isViewMode && role !== UserRole.ETUDIANT;
  }

  get viewSwitchRoleLabel(): string {
    const role = this.authService.currentUser()?.role;
    if (role === UserRole.ADMIN) return 'Admin';
    if (role === UserRole.ENSEIGNANT) return 'Enseignant';
    if (role === UserRole.ENTREPRISE) return 'Entreprise';
    return 'Mon espace';
  }

  get viewSwitchReturnRoute(): string {
    const role = this.authService.currentUser()?.role;
    if (role === UserRole.ADMIN) return '/admin/home';
    if (role === UserRole.ENSEIGNANT) return '/enseignant/home';
    if (role === UserRole.ENTREPRISE) return '/entreprise/jobs';
    return '/';
  }

  returnToRoleView() {
    localStorage.removeItem('viewMode');
    this.router.navigate([this.viewSwitchReturnRoute]);
  }

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isHomePage = event.urlAfterRedirects === '/etudiant/home' || event.urlAfterRedirects === '/etudiant';
    });
  }
}
