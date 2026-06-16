import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MyCommunityComponent } from './my-community/my-community.component';
import { JobsBoardComponent } from './jobs-board/jobs-board.component';
import { ResourcesWidgetComponent } from './resources-widget/resources-widget.component';
import { RecentFeedPostsComponent } from './recent-feed-posts/recent-feed-posts.component';
import { FacebookWidgetComponent } from './facebook-widget/facebook-widget.component';
import { BadgeModalComponent } from './badge-modal/badge-modal.component';
import { UserService } from '../../../core/services/User.service';
import { BadgeService } from '../../../core/services/badge.service';
import { User, Badge } from '../../../core/models/user.model';
import { HomepageSettingsService, HomepageSettings } from '../../../core/services/homepage-settings.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MyCommunityComponent,
    JobsBoardComponent,
    ResourcesWidgetComponent,
    RecentFeedPostsComponent,
    FacebookWidgetComponent,
    BadgeModalComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private userService = inject(UserService);
  private badgeService = inject(BadgeService);
  private router = inject(Router);
  private settingsService = inject(HomepageSettingsService);

  user: User | null = null;
  completionPercentage: number = 0;
  
  isBadgeModalOpen: boolean = false;
  userBadges: Badge[] = [];

  settings: HomepageSettings = { displayBanner: true, primaryColor: '#ed1c24', bannerImageUrl: '' };

  ngOnInit(): void {
    this.loadUserData();
    this.settingsService.settings$.subscribe(s => this.settings = s);
  }

  private loadUserData(): void {
    this.userService.getCurrentUser().subscribe({
      next: (userData) => {
        this.user = userData;
        this.calculateCompletion();
      },
      error: (err) => console.error('Error loading user data', err)
    });
  }

  private calculateCompletion(): void {
    if (!this.user) return;

    let points = 0;
    const fields = [
      this.user.avatarUrl,
      this.user.bio,
      this.user.code,
      this.user.companyName,
      this.user.jobTitle,
      this.user.numTel,
      this.user.linkedinUrl,
      this.user.githubUrl,
      this.user.facebookUrl,
      this.user.badges && this.user.badges.length > 0
    ];

    fields.forEach(field => {
      if (field) points += 10;
    });

    this.completionPercentage = points;
  }

  navigateToProfile(): void {
    this.router.navigate(['/etudiant/profile']);
  }

  openBadgeModal(): void {
    if (!this.user) return;
    
    this.badgeService.getUserBadges(this.user.id).subscribe({
      next: (badges) => {
        this.userBadges = badges;
        this.isBadgeModalOpen = true;
      },
      error: (err) => console.error('Error loading badges', err)
    });
  }
}
