import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { AncienSidebarComponent } from '../ancien-sidebar/ancien-sidebar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { HomepageSettingsService } from '../../../core/services/homepage-settings.service';
import { UserRole } from '../../../core/models/user-role.enum';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ancien-shell',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, AncienSidebarComponent, CommonModule],
  templateUrl: './ancien-shell.component.html',
  styleUrls: ['./ancien-shell.component.css']
})
export class AncienShellComponent implements OnInit, OnDestroy {
  isHomePage = false;
  bannerImageUrl = '';
  displayBanner = true;
  private settingsService = inject(HomepageSettingsService);
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.settingsService.settingsForRole$(UserRole.ALUMNI).subscribe(s => {
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
      this.isHomePage = event.urlAfterRedirects === '/ancien/home' || event.urlAfterRedirects === '/ancien';
    });
  }
}
