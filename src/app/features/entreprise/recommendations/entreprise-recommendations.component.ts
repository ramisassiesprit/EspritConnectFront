import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecommendationService } from '../../../core/services/recommendation.service';

@Component({
  selector: 'app-entreprise-recommendations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entreprise-recommendations.component.html',
  styleUrl: './entreprise-recommendations.component.css'
})
export class EntrepriseRecommendationsComponent implements OnInit {
  private readonly recommendationService = inject(RecommendationService);

  candidates: any[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.recommendationService.getCompanyRecommendations().subscribe({
      next: (data) => {
        this.candidates = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load recommendations. Make sure your company profile (industry, bio) is filled in.';
        this.loading = false;
      }
    });
  }
}
