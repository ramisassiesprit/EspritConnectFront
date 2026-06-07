import { inject } from '@angular/core';
import { Routes, Router } from '@angular/router';
import { AcceuilComponent } from './acceuil/acceuil.component';
import { AuthService } from './core/services/auth.service';
import { UserRole } from './core/models/user-role.enum';
import { etudiantGuard } from './core/guards/etudiant.guard';
import { adminGuard } from './core/guards/admin.guard';
import { entrepriseGuard } from './core/guards/entreprise.guard';
import { ancienGuard } from './core/guards/ancien.guard';
import { enseignantGuard } from './core/guards/enseignant.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [
      () => {
        const authService = inject(AuthService);
        const router = inject(Router);
        if (authService.isLoggedIn()) {
          return router.createUrlTree([authService.getHomePath()]);
        }
        return router.createUrlTree(['/acceuil']);
      },
    ],
    component: AcceuilComponent, // Dummy, will be redirected anyway
  },
  {
    path: 'acceuil',
    canActivate: [
      () => {
        const authService = inject(AuthService);
        const router = inject(Router);
        if (authService.isLoggedIn()) {
          const homePath = authService.getHomePath();
          if (homePath !== '/acceuil') {
            return router.createUrlTree([homePath]);
          }
        }
        return true;
      },
    ],
    component: AcceuilComponent,
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: 'oauth2-redirect',
    loadComponent: () =>
      import('./auth/oauth2-redirect/oauth2-redirect.component').then(
        (m) => m.Oauth2RedirectComponent,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'ai-chat',
    loadComponent: () =>
      import('./features/ai/ai-chat-page/ai-chat-page.component').then(
        (m) => m.AiChatPageComponent,
      ),
  },
  {
    path: 'etudiant',
    canActivate: [etudiantGuard],
    loadComponent: () =>
      import('./features/etudiant/etudiant-shell/etudiant-shell.component').then(
        (m) => m.EtudiantShellComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/etudiant/home/home.component').then(
            (m) => m.HomeComponent,
          ),
      },
      {
        path: 'feed',
        loadComponent: () =>
          import('./features/etudiant/feed/feed.component').then(
            (m) => m.FeedComponent,
          ),
      },
      {
        path: 'directory',
        loadComponent: () =>
          import('./features/etudiant/directory/directory.component').then(
            (m) => m.DirectoryComponent,
          ),
      },
      {
        path: 'mentoring',
        loadComponent: () =>
          import('./features/etudiant/mentoring/mentoring.component').then(
            (m) => m.MentoringComponent,
          ),
        children: [
          {
            path: '',
            redirectTo: 'find',
            pathMatch: 'full',
          },
          {
            path: 'find',
            loadComponent: () =>
              import(
                './features/etudiant/mentoring/find-mentor/find-mentor.component'
              ).then((m) => m.FindMentorComponent),
          },
          {
            path: 'relations',
            loadComponent: () =>
              import(
                './features/etudiant/mentoring/mentor-relations/mentor-relations.component'
              ).then((m) => m.MentorRelationsComponent),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import(
                './features/etudiant/mentoring/MentorSettings/mentoringSettings.component'
              ).then((m) => m.MentoringSettingsComponent),
          }
        ],
      },
      {
        path: 'jobs',
        loadComponent: () =>
          import('./features/etudiant/jobs/jobs.component').then(
            (m) => m.JobsComponent,
          ),
      },
      {
        path: 'jobs/board',
        redirectTo: 'jobs',
        pathMatch: 'full',
      },
      {
        path: 'jobs/:id',
        loadComponent: () =>
          import('./features/etudiant/jobs/jobs.component').then(
            (m) => m.JobsComponent,
          ),
      },
      {
        path: 'photos',
        loadComponent: () =>
          import('./features/etudiant/photos/photos.component').then(
            (m) => m.PhotosComponent,
          ),
      },
      {
        path: 'groups',
        loadComponent: () => import('./features/etudiant/groups/groups.component').then(m => m.GroupsComponent),
        children: [
          {
            path: 'create',
            loadComponent: () => import('./features/etudiant/groups/group-create/group-create.component').then(m => m.GroupCreateComponent)
          },
          {
            path: 'requests',
            loadComponent: () => import('./features/etudiant/groups/group-requests/group-requests.component').then(m => m.GroupRequestsComponent)
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./features/etudiant/groups/group-update/group-update.component').then(m => m.GroupUpdateComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/etudiant/groups/group-details/group-details.component').then(m => m.GroupDetailsComponent),
            children: [
              { path: '', redirectTo: 'feed', pathMatch: 'full' },
              { path: 'feed', loadComponent: () => import('./features/etudiant/groups/group-details/tabs/group-feed-tab/group-feed-tab.component').then(m => m.GroupFeedTabComponent) },
              { path: 'members', loadComponent: () => import('./features/etudiant/groups/group-details/tabs/group-members-tab/group-members-tab.component').then(m => m.GroupMembersTabComponent) },
              { path: 'photos-albums', loadComponent: () => import('./features/etudiant/groups/group-details/tabs/group-photos-tab/group-photos-tab.component').then(m => m.GroupPhotosTabComponent) },
              { path: 'events', loadComponent: () => import('./features/etudiant/groups/group-details/tabs/group-events-tab/group-events-tab.component').then(m => m.GroupEventsTabComponent) },
            ]
          }
        ]
      },
      {
        path: 'events',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/etudiant/events/events.component').then(
                (m) => m.EventsComponent,
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/etudiant/events/event-details/event-details.component').then(
                (m) => m.EventDetailsComponent,
              ),
          }
        ]
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./features/etudiant/resources/resources.component').then(
            (m) => m.ResourcesComponent,
          ),
      },
      {
        path: 'resources/:id',
        loadComponent: () =>
          import('./features/etudiant/resources/resources.component').then(
            (m) => m.ResourcesComponent,
          ),
      },
      {
        path: 'info-support',
        loadComponent: () =>
          import('./features/etudiant/info-support/info-support.component').then(
            (m) => m.InfoSupportComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/etudiant/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'recommendations',
        loadComponent: () => import('./features/etudiant/recommendations/recommendations.component').then(m => m.RecommendationsComponent)
      },
      {
        path: 'chat/:id',
        loadComponent: () => import('./features/etudiant/chat/chat.component').then(m => m.ChatComponent)
      },
      {
        path: 'messages',
        loadComponent: () => import('./features/etudiant/chat/chat-list.component').then(m => m.ChatListComponent)
      },
      {
        path: 'user/:id',
        loadComponent: () => import('./features/etudiant/user-details/user-details.component').then(m => m.UserDetailsComponent)
      },
      {
        path: 'mock-interview',
        loadComponent: () => import('./features/etudiant/mock-interview/mock-interview.component').then(m => m.MockInterviewComponent)
      }
    ]
  },
  {
    path: 'ancien',
    canActivate: [ancienGuard],
    loadComponent: () =>
      import('./features/ancien/ancien-shell/ancien-shell.component').then(
        (m) => m.AncienShellComponent,
      ),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', loadComponent: () => import('./features/etudiant/home/home.component').then((m) => m.HomeComponent) },
      { path: 'feed', loadComponent: () => import('./features/etudiant/feed/feed.component').then((m) => m.FeedComponent) },
      { path: 'directory', loadComponent: () => import('./features/etudiant/directory/directory.component').then((m) => m.DirectoryComponent) },
      {
        path: 'mentoring',
        loadComponent: () => import('./features/etudiant/mentoring/mentoring.component').then((m) => m.MentoringComponent),
        children: [
          { path: '', redirectTo: 'relations', pathMatch: 'full' },
          { path: 'relations', loadComponent: () => import('./features/etudiant/mentoring/mentor-relations/mentor-relations.component').then((m) => m.MentorRelationsComponent) },
          { path: 'settings', loadComponent: () => import('./features/etudiant/mentoring/MentorSettings/mentoringSettings.component').then((m) => m.MentoringSettingsComponent) }
        ]
      },
      { path: 'jobs', loadComponent: () => import('./features/etudiant/jobs/jobs.component').then((m) => m.JobsComponent) },
      { path: 'jobs/board', redirectTo: 'jobs', pathMatch: 'full' },
      { path: 'jobs/:id', loadComponent: () => import('./features/etudiant/jobs/jobs.component').then((m) => m.JobsComponent) },
      { path: 'photos', loadComponent: () => import('./features/etudiant/photos/photos.component').then((m) => m.PhotosComponent) },
      {
        path: 'groups',
        loadComponent: () => import('./features/etudiant/groups/groups.component').then(m => m.GroupsComponent),
        children: [
          { path: 'create', loadComponent: () => import('./features/etudiant/groups/group-create/group-create.component').then(m => m.GroupCreateComponent) },
          { path: 'requests', loadComponent: () => import('./features/etudiant/groups/group-requests/group-requests.component').then(m => m.GroupRequestsComponent) },
          { path: 'edit/:id', loadComponent: () => import('./features/etudiant/groups/group-update/group-update.component').then(m => m.GroupUpdateComponent) },
          {
            path: ':id',
            loadComponent: () => import('./features/etudiant/groups/group-details/group-details.component').then(m => m.GroupDetailsComponent),
            children: [
              { path: '', redirectTo: 'feed', pathMatch: 'full' },
              { path: 'feed', loadComponent: () => import('./features/etudiant/groups/group-details/tabs/group-feed-tab/group-feed-tab.component').then(m => m.GroupFeedTabComponent) },
              { path: 'members', loadComponent: () => import('./features/etudiant/groups/group-details/tabs/group-members-tab/group-members-tab.component').then(m => m.GroupMembersTabComponent) },
              { path: 'photos-albums', loadComponent: () => import('./features/etudiant/groups/group-details/tabs/group-photos-tab/group-photos-tab.component').then(m => m.GroupPhotosTabComponent) },
              { path: 'events', loadComponent: () => import('./features/etudiant/groups/group-details/tabs/group-events-tab/group-events-tab.component').then(m => m.GroupEventsTabComponent) },
            ]
          }
        ]
      },
      {
        path: 'events',
        children: [
          { path: '', loadComponent: () => import('./features/etudiant/events/events.component').then((m) => m.EventsComponent) },
          { path: ':id', loadComponent: () => import('./features/etudiant/events/event-details/event-details.component').then((m) => m.EventDetailsComponent) }
        ]
      },
      { path: 'resources', loadComponent: () => import('./features/etudiant/resources/resources.component').then((m) => m.ResourcesComponent) },
      { path: 'resources/:id', loadComponent: () => import('./features/etudiant/resources/resources.component').then((m) => m.ResourcesComponent) },
      { path: 'info-support', loadComponent: () => import('./features/etudiant/info-support/info-support.component').then((m) => m.InfoSupportComponent) },
      { path: 'profile', loadComponent: () => import('./features/etudiant/profile/profile.component').then(m => m.ProfileComponent) }
    ]
  },
  {
    path: 'enseignant',
    canActivate: [enseignantGuard],
    loadComponent: () =>
      import('./features/enseignant/enseignant-shell/enseignant-shell.component').then(
        (m) => m.EnseignantShellComponent,
      ),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', loadComponent: () => import('./features/etudiant/home/home.component').then((m) => m.HomeComponent) },
      { path: 'feed', loadComponent: () => import('./features/etudiant/feed/feed.component').then((m) => m.FeedComponent) },
      { path: 'directory', loadComponent: () => import('./features/etudiant/directory/directory.component').then((m) => m.DirectoryComponent) },
      {
        path: 'groups',
        loadComponent: () => import('./features/etudiant/groups/groups.component').then(m => m.GroupsComponent),
        children: [
          { path: 'create', loadComponent: () => import('./features/etudiant/groups/group-create/group-create.component').then(m => m.GroupCreateComponent) },
          { path: 'requests', loadComponent: () => import('./features/etudiant/groups/group-requests/group-requests.component').then(m => m.GroupRequestsComponent) },
          { path: 'edit/:id', loadComponent: () => import('./features/etudiant/groups/group-update/group-update.component').then(m => m.GroupUpdateComponent) },
          {
            path: ':id',
            loadComponent: () => import('./features/etudiant/groups/group-details/group-details.component').then(m => m.GroupDetailsComponent),
            children: [
              { path: '', redirectTo: 'feed', pathMatch: 'full' },
              { path: 'feed', loadComponent: () => import('./features/etudiant/groups/group-details/tabs/group-feed-tab/group-feed-tab.component').then(m => m.GroupFeedTabComponent) },
              { path: 'members', loadComponent: () => import('./features/etudiant/groups/group-details/tabs/group-members-tab/group-members-tab.component').then(m => m.GroupMembersTabComponent) },
              { path: 'photos-albums', loadComponent: () => import('./features/etudiant/groups/group-details/tabs/group-photos-tab/group-photos-tab.component').then(m => m.GroupPhotosTabComponent) },
              { path: 'events', loadComponent: () => import('./features/etudiant/groups/group-details/tabs/group-events-tab/group-events-tab.component').then(m => m.GroupEventsTabComponent) },
            ]
          }
        ]
      },
      {
        path: 'events',
        children: [
          { path: '', loadComponent: () => import('./features/etudiant/events/events.component').then((m) => m.EventsComponent) },
          { path: ':id', loadComponent: () => import('./features/etudiant/events/event-details/event-details.component').then((m) => m.EventDetailsComponent) }
        ]
      },
      { path: 'resources', loadComponent: () => import('./features/etudiant/resources/resources.component').then((m) => m.ResourcesComponent) },
      { path: 'resources/:id', loadComponent: () => import('./features/etudiant/resources/resources.component').then((m) => m.ResourcesComponent) },
      { path: 'info-support', loadComponent: () => import('./features/etudiant/info-support/info-support.component').then((m) => m.InfoSupportComponent) },
      { path: 'profile', loadComponent: () => import('./features/etudiant/profile/profile.component').then(m => m.ProfileComponent) }
    ]
  },
  {
    path: 'entreprise',
    canActivate: [entrepriseGuard],
    loadComponent: () =>
      import('./features/entreprise/entreprise-shell/entreprise-shell.component').then(
        (m) => m.EntrepriseShellComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'jobs',
        pathMatch: 'full',
      },
      {
        path: 'jobs',
        loadComponent: () =>
          import('./features/admin/jobs/admin-jobs.component').then(
            (m) => m.AdminJobsComponent,
          ),
      },
      {
        path: 'jobs/new',
        loadComponent: () =>
          import('./features/admin/jobs/admin-jobs.component').then(
            (m) => m.AdminJobsComponent,
          ),
      },
      {
        path: 'jobs/:id/applicants',
        loadComponent: () =>
          import('./features/entreprise/job-applicants/job-applicants.component').then(
            (m) => m.JobApplicantsComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/etudiant/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import(
            './features/etudiant/mentoring/MentorSettings/mentoringSettings.component'
          ).then((m) => m.MentoringSettingsComponent),
      },
      {
        path: 'recommendations',
        loadComponent: () =>
          import('./features/entreprise/recommendations/entreprise-recommendations.component').then(
            (m) => m.EntrepriseRecommendationsComponent
          ),
      },
      {
        path: 'ats-board',
        loadComponent: () =>
          import('./features/entreprise/ats-board/ats-board.component').then(
            (m) => m.AtsBoardComponent
          ),
      },
      {
        path: 'insights',
        loadComponent: () =>
          import('./features/entreprise/talent-insights/talent-insights.component').then(
            (m) => m.TalentInsightsComponent
          ),
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-shell/admin-shell.component').then(
        (m) => m.AdminShellComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/Users/users-list.component').then(
            (m) => m.UsersListComponent,
          ),
      },
      {
        path: 'users/:id',
        loadComponent: () =>
          import('./features/admin/Users/user-details/user-details.component').then(
            (m) => m.UserDetailsComponent,
          ),
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./features/admin/resources/admin-resources.component').then(
            (m) => m.AdminResourcesComponent,
          ),
      },
      {
        path: 'groups',
        loadComponent: () => import('./features/admin/admin-shell/groups-manage/groups-manage.component').then(m => m.GroupsManageComponent),
      },
      {
        path: 'groups/:id',
        loadComponent: () => import('./features/admin/admin-shell/groups-control/groups-control.component').then(m => m.GroupsControlComponent),
      },
      {
        path: 'groups/:id/edit',
        loadComponent: () => import('./features/etudiant/groups/group-update/group-update.component').then(m => m.GroupUpdateComponent),
      },
      {
        path: 'jobs',
        loadComponent: () =>
          import('./features/admin/jobs/admin-jobs.component').then(
            (m) => m.AdminJobsComponent,
          ),
      },
      {
        path: 'jobs/:id/applicants',
        loadComponent: () =>
          import('./features/entreprise/job-applicants/job-applicants.component').then(
            (m) => m.JobApplicantsComponent,
          ),
      },
      {
        path: 'events',
        loadComponent: () =>
          import('./features/admin/events/admin-events.component').then(
            (m) => m.AdminEventsComponent,
          ),
      },
    ],
  },
];


