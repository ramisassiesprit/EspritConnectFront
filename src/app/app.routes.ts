import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'etudiant',
    pathMatch: 'full'
  },
  {
    path: 'etudiant',
    loadComponent: () => import('./features/etudiant/etudiant-shell/etudiant-shell.component').then(m => m.EtudiantShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./features/etudiant/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'feed',
        loadComponent: () => import('./features/etudiant/feed/feed.component').then(m => m.FeedComponent)
      },
      {
        path: 'directory',
        loadComponent: () => import('./features/etudiant/directory/directory.component').then(m => m.DirectoryComponent)
      },
      {
        path: 'mentoring',
        loadComponent: () => import('./features/etudiant/mentoring/mentoring.component').then(m => m.MentoringComponent)
      },
      {
        path: 'jobs',
        loadComponent: () => import('./features/etudiant/jobs/jobs.component').then(m => m.JobsComponent)
      },
      {
        path: 'photos',
        loadComponent: () => import('./features/etudiant/photos/photos.component').then(m => m.PhotosComponent)
      },
      {
        path: 'groups',
        loadComponent: () => import('./features/etudiant/groups/groups.component').then(m => m.GroupsComponent)
      },
      {
        path: 'events',
        loadComponent: () => import('./features/etudiant/events/events.component').then(m => m.EventsComponent)
      },
      {
        path: 'resources',
        loadComponent: () => import('./features/etudiant/resources/resources.component').then(m => m.ResourcesComponent)
      },
      {
        path: 'info-support',
        loadComponent: () => import('./features/etudiant/info-support/info-support.component').then(m => m.InfoSupportComponent)
      }
    ]
  },
  {
    path: 'ancien',
    loadComponent: () => import('./features/ancien/ancien-shell/ancien-shell.component').then(m => m.AncienShellComponent)
  },
  {
    path: 'enseignant',
    loadComponent: () => import('./features/enseignant/enseignant-shell/enseignant-shell.component').then(m => m.EnseignantShellComponent)
  },
  {
    path: 'entreprise',
    loadComponent: () => import('./features/entreprise/entreprise-shell/entreprise-shell.component').then(m => m.EntrepriseShellComponent)
  }
];
