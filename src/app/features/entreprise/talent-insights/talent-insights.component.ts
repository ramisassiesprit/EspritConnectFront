import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { environment } from '../../../../environments/environment';

Chart.register(...registerables);

@Component({
  selector: 'app-talent-insights',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './talent-insights.component.html',
  styleUrls: ['./talent-insights.component.css']
})
export class TalentInsightsComponent implements AfterViewInit, OnDestroy {
  
  skillsInsight: string = '';
  activityInsight: string = '';

  @ViewChild('skillsCanvas') skillsCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('activityCanvas') activityCanvas!: ElementRef<HTMLCanvasElement>;

  private skillsChartInstance?: Chart;
  private activityChartInstance?: Chart;

  constructor(private http: HttpClient) {}

  ngAfterViewInit(): void {
    this.initSkillsChart();
    this.initActivityChart();
  }

  ngOnDestroy(): void {
    if (this.skillsChartInstance) this.skillsChartInstance.destroy();
    if (this.activityChartInstance) this.activityChartInstance.destroy();
  }

  initSkillsChart() {
    this.http.get<any>(`${environment.apiUrl}analytics/skills-trend`).subscribe(data => {
      // Générer l'insight dynamiquement
      if (data.labels.length > 0) {
        const topSkill = data.labels[0];
        this.skillsInsight = `La compétence "${topSkill}" est actuellement la plus répandue parmi les profils. Ciblez vos offres en conséquence !`;
      } else {
        this.skillsInsight = `Pas encore assez de données pour générer un insight sur les compétences.`;
      }

      const config: ChartConfiguration = {
        type: 'doughnut',
        data: {
          labels: data.labels,
          datasets: [{
            data: data.values,
            backgroundColor: [
              '#4ade80', '#fb923c', '#60a5fa', '#a78bfa', '#94a3b8'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'right' } }
        }
      };
      if (this.skillsCanvas) {
        if (this.skillsChartInstance) this.skillsChartInstance.destroy();
        this.skillsChartInstance = new Chart(this.skillsCanvas.nativeElement, config);
      }
    });
  }

  initActivityChart() {
    this.http.get<any>(`${environment.apiUrl}analytics/applications-activity`).subscribe({
      next: data => {
        if (!data || !data.values || !Array.isArray(data.values) || data.values.length === 0) {
          this.activityInsight = `Pas assez de données pour générer l'analyse d'activité.`;
          data = { labels: ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'], values: Array(12).fill(0) };
        } else {
          // Trouver le mois avec le plus d'activité
          const maxIndex = data.values.indexOf(Math.max(...data.values));
          const peakMonth = data.labels[maxIndex];
          const peakValue = data.values[maxIndex];
          if (peakValue > 0) {
            this.activityInsight = `Le pic de candidatures se situe en ${peakMonth} avec ${peakValue} candidatures. C'est le moment idéal pour publier de nouvelles offres.`;
          } else {
            this.activityInsight = `Vous n'avez pas encore reçu de candidatures cette année. Publiez des offres attractives pour attirer les talents !`;
          }
        }

        const config: ChartConfiguration = {
          type: 'bar',
          data: {
            labels: data.labels,
            datasets: [{
              label: 'Volume de Candidatures (EspritConnect)',
              data: data.values,
              backgroundColor: '#3b82f6',
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
          }
        };
        if (this.activityCanvas) {
          if (this.activityChartInstance) this.activityChartInstance.destroy();
          this.activityChartInstance = new Chart(this.activityCanvas.nativeElement, config);
        }
      },
      error: err => {
        console.error('Erreur analytics/applications-activity', err);
        this.activityInsight = 'Impossible de charger l\'activité des candidatures (erreur serveur).';
        const fallback = { labels: ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'], values: Array(12).fill(0) };
        const config: ChartConfiguration = {
          type: 'bar',
          data: {
            labels: fallback.labels,
            datasets: [{
              label: 'Volume de Candidatures (EspritConnect)',
              data: fallback.values,
              backgroundColor: '#3b82f6',
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
          }
        };
        if (this.activityCanvas) {
          if (this.activityChartInstance) this.activityChartInstance.destroy();
          this.activityChartInstance = new Chart(this.activityCanvas.nativeElement, config);
        }
      }
    });
  }
}
