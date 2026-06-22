import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { EnseignantSidebarComponent } from '../enseignant-sidebar/enseignant-sidebar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { HomepageSettingsService } from '../../../core/services/homepage-settings.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-enseignant-shell',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, EnseignantSidebarComponent, CommonModule],
  templateUrl: './enseignant-shell.component.html',
  styleUrls: ['./enseignant-shell.component.css']
})
export class EnseignantShellComponent implements OnInit, OnDestroy {
  isHomePage = false;
  bannerImageUrl = '';
  displayBanner = true;
  private settingsService = inject(HomepageSettingsService);
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.settingsService.settings$.subscribe(s => {
      this.bannerImageUrl = s.bannerImageUrl;
      this.displayBanner = s.displayBanner;
    });
  }

  heroBackground(): string {
    if (this.displayBanner && this.bannerImageUrl) {
      return `url(${this.settingsService.resolveImageUrl(this.bannerImageUrl)}) center / cover no-repeat`;
    }
    return 'url(/forum.png) center / cover no-repeat';
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isHomePage = event.urlAfterRedirects === '/enseignant/home' || event.urlAfterRedirects === '/enseignant';
    });
  }
}
