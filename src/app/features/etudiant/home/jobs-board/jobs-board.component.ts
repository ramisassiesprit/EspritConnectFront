import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { JobOffer } from '../../../../core/models/job.model';
import { JobService } from '../../../../core/services/job.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-jobs-board',
  imports: [CommonModule, RouterLink],
  templateUrl: './jobs-board.component.html',
  styleUrl: './jobs-board.component.css'
})
export class JobsBoardComponent implements OnInit {
  private readonly jobService = inject(JobService);
  private readonly router = inject(Router);

  jobs: JobOffer[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.loadJobs();
  }

  openJob(id?: string): void {
    if (!id) {
      return;
    }
    this.router.navigate(['/etudiant/jobs', id]);
  }

  resolveImageUrl(url?: string): string {
    if (!url || !url.trim()) {
      return '';
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/EspritConnect')) {
      return `${window.location.protocol}//${window.location.hostname}:8086${url}`;
    }
    const base = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  }

  private loadJobs(): void {
    this.loading = true;
    this.error = '';
    this.jobService.getAllJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs
          .filter((j) => j.status === 'OPEN')
          .sort((a, b) => {
            const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bDate - aDate;
          })
          .slice(0, 6);
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load jobs right now.';
        this.loading = false;
      }
    });
  }
}
