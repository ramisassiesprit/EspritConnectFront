import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { forkJoin, finalize, filter } from 'rxjs';
import { GroupService } from '../../../core/services/group.service';
import { AuthService } from '../../../core/services/auth.service';
import { Group } from '../../../core/models/group.model';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit {
  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private router = inject(Router);

  joinedGroups: Group[] = [];
  allGroups: Group[] = [];
  loading = false;
  error = '';
  isCreateRoute = false;

  ngOnInit() {
    this.updateRouteMode(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateRouteMode(event.urlAfterRedirects);
    });
    const session = this.authService.currentUser();
    if (!session?.userId) {
      this.error = 'Unable to load group data for the current user.';
      return;
    }

    this.loading = true;
    forkJoin({
      joined: this.groupService.getUserGroups(session.userId),
      all: this.groupService.getAllGroups()
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: ({ joined, all }) => {
          this.joinedGroups = joined;
          this.allGroups = all;
        },
        error: () => this.error = 'Failed to load groups. Please refresh the page.'
      });
  }

  private updateRouteMode(url: string) {
    this.isCreateRoute = url.endsWith('/create');
  }
}
