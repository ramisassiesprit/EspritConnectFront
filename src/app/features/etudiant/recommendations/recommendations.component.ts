import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RecommendationService, RecommendationResult } from '../../../core/services/recommendation.service';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.css']
})
export class RecommendationsComponent implements OnInit {
  private recService = inject(RecommendationService);

  recommendations: RecommendationResult = {
    jobs: [],
    events: [],
    groups: [],
    mentors: []
  };

  loading = true;
  activeTab = 'jobs';

  ngOnInit(): void {
    this.recService.getUserRecommendations().subscribe({
      next: (data) => {
        this.recommendations = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching recommendations', err);
        this.loading = false;
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}
