import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, ChartOptions, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MentoringPreferencesService, MentoringPreferences } from '../../../../core/services/mentoring-preferences.service';
import { MentorshipService, MentoringStats } from '../../../../core/services/mentorship.service';

Chart.register(...registerables);

interface SectionConfig {
  toggleKey: keyof MentoringPreferences;
  optionsKey: keyof MentoringPreferences;
  label: string;
  description: string;
  allOptions: string[];
}

@Component({
  selector: 'app-mentoring-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './mentoring-preferences.component.html',
  styleUrl: './mentoring-preferences.component.css'
})
export class MentoringPreferencesComponent {
  private prefsService = inject(MentoringPreferencesService);
  private mentorshipService = inject(MentorshipService);

  activeTab: 'settings' | 'stats' = 'settings';

  prefs: MentoringPreferences = {
    showOfferHelp: true,
    showSeekHelp: true,
    showOfferMentoring: true,
    showSeekMentoring: true
  };

  saving = false;
  saveMessage = '';
  saveError = false;

  stats: MentoringStats | null = null;
  loadingStats = false;
  statsError = false;

  // ── Chart.js configurations ────────────────────────────────────────────────
  statusDoughnutData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };
  statusDoughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 12, font: { size: 12 } } } }
  };

  monthlyBarData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  monthlyBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
  };

  ratingBarData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  ratingBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
  };

  supplyDemandBarData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  supplyDemandBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 12 } } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
  };

  readonly helpOptions = [
    'Introduction to connections',
    'Answer industry specific questions',
    'Open doors at workplace',
    'Meet for coffee'
  ];

  readonly mentoringOptions = [
    'Mentor a young professional',
    'Mentor a student',
    'Career advice',
    'Resume review',
    'Internship'
  ];

  sections: SectionConfig[] = [
    {
      toggleKey: 'showOfferHelp',
      optionsKey: 'offerHelpOptions',
      label: 'Offer Help',
      description: 'Users can offer help to others',
      allOptions: this.helpOptions
    },
    {
      toggleKey: 'showSeekHelp',
      optionsKey: 'seekHelpOptions',
      label: 'Seek Help',
      description: 'Users can seek help from others',
      allOptions: this.helpOptions
    },
    {
      toggleKey: 'showOfferMentoring',
      optionsKey: 'offerMentorOptions',
      label: 'Offer Mentoring',
      description: 'Users can offer to mentor others',
      allOptions: this.mentoringOptions
    },
    {
      toggleKey: 'showSeekMentoring',
      optionsKey: 'seekMentorOptions',
      label: 'Seek Mentoring',
      description: 'Users can request a mentor',
      allOptions: this.mentoringOptions
    }
  ];

  constructor() {
    this.load();
  }

  private allFor(key: keyof MentoringPreferences): string[] {
    const section = this.sections.find(s => s.optionsKey === key);
    return section ? section.allOptions : [];
  }

  load() {
    this.prefsService.getPreferences().subscribe({
      next: (res) => {
        this.prefs = {
          showOfferHelp: res.showOfferHelp,
          showSeekHelp: res.showSeekHelp,
          showOfferMentoring: res.showOfferMentoring,
          showSeekMentoring: res.showSeekMentoring,
          offerHelpOptions: res.offerHelpOptions ?? this.allFor('offerHelpOptions'),
          seekHelpOptions: res.seekHelpOptions ?? this.allFor('seekHelpOptions'),
          offerMentorOptions: res.offerMentorOptions ?? this.allFor('offerMentorOptions'),
          seekMentorOptions: res.seekMentorOptions ?? this.allFor('seekMentorOptions')
        };
      },
      error: () => {}
    });
  }

  loadStats() {
    this.loadingStats = true;
    this.statsError = false;
    this.mentorshipService.getStats().subscribe({
      next: (s) => {
        this.stats = s;
        this.prepareCharts();
        this.loadingStats = false;
      },
      error: () => {
        this.loadingStats = false;
        this.statsError = true;
      }
    });
  }

  switchTab(tab: 'settings' | 'stats') {
    this.activeTab = tab;
    if (tab === 'stats' && !this.stats && !this.loadingStats) {
      this.loadStats();
    }
  }

  isOptionChecked(section: SectionConfig, option: string): boolean {
    const list = this.prefs[section.optionsKey] as string[] | undefined;
    return list ? list.includes(option) : true;
  }

  toggleOption(section: SectionConfig, option: string, checked: boolean) {
    const current = this.prefs[section.optionsKey] as string[] | undefined;
    let list = current ? [...current] : [];
    if (checked) {
      if (!list.includes(option)) list.push(option);
    } else {
      if (list.length === 0) {
        list = section.allOptions.filter(o => o !== option);
      } else {
        list = list.filter(o => o !== option);
      }
    }
    this.prefs = { ...this.prefs, [section.optionsKey]: list };
  }

  visibleOptions(section: SectionConfig): string[] {
    const list = this.prefs[section.optionsKey] as string[] | undefined;
    if (list === undefined || list === null) return section.allOptions;
    return list;
  }

  save() {
    this.saving = true;
    this.saveMessage = '';
    this.saveError = false;

    this.prefsService.savePreferences(this.prefs).subscribe({
      next: (res) => {
        this.prefs = {
          showOfferHelp: res.showOfferHelp,
          showSeekHelp: res.showSeekHelp,
          showOfferMentoring: res.showOfferMentoring,
          showSeekMentoring: res.showSeekMentoring,
          offerHelpOptions: res.offerHelpOptions ?? this.allFor('offerHelpOptions'),
          seekHelpOptions: res.seekHelpOptions ?? this.allFor('seekHelpOptions'),
          offerMentorOptions: res.offerMentorOptions ?? this.allFor('offerMentorOptions'),
          seekMentorOptions: res.seekMentorOptions ?? this.allFor('seekMentorOptions')
        };
        this.saving = false;
        this.saveMessage = 'Preferences saved successfully!';
      },
      error: () => {
        this.saving = false;
        this.saveError = true;
        this.saveMessage = 'Failed to save preferences. Please try again.';
      }
    });
  }

  objectKeys(obj: Record<string, any> | undefined): string[] {
    return obj ? Object.keys(obj) : [];
  }

  maxValue(map: Record<string, number> | undefined): number {
    if (!map) return 1;
    return Math.max(...Object.values(map), 1);
  }

  barWidth(value: number, max: number): number {
    return max > 0 ? (value / max) * 100 : 0;
  }

  totalStatValue(map: Record<string, number> | undefined): number {
    if (!map) return 0;
    return Object.values(map).reduce((a, b) => a + b, 0);
  }

  donutBackground(segments: { label: string; value: number; color: string }[]): string {
    const total = segments.reduce((a, s) => a + s.value, 0);
    if (total === 0) return 'conic-gradient(#eee 0deg 360deg)';
    let accumulated = 0;
    const parts = segments.map(s => {
      const start = (accumulated / total) * 360;
      accumulated += s.value;
      const end = (accumulated / total) * 360;
      return `${s.color} ${start}deg ${end}deg`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }

  statusSegments(): { label: string; value: number; color: string }[] {
    if (!this.stats) return [];
    return [
      { label: 'Pending', value: this.stats.pendingRequests, color: '#f59e0b' },
      { label: 'Accepted', value: this.stats.acceptedRequests, color: '#22c55e' },
      { label: 'Rejected', value: this.stats.rejectedRequests, color: '#ef4444' },
      { label: 'Completed', value: this.stats.completedRequests, color: '#3b82f6' },
      { label: 'Cancelled', value: this.stats.cancelledRequests, color: '#9ca3af' }
    ];
  }

  // ── Chart preparation ──────────────────────────────────────────────────────
  private prepareCharts(): void {
    if (!this.stats) return;

    // Doughnut — request status distribution
    const segments = this.statusSegments();
    this.statusDoughnutData = {
      labels: segments.map(s => s.label),
      datasets: [{
        data: segments.map(s => s.value),
        backgroundColor: segments.map(s => s.color),
        borderColor: '#fff',
        borderWidth: 2
      }]
    };

    // Bar — monthly trend
    const monthLabels = Object.keys(this.stats.requestsByMonth || {});
    this.monthlyBarData = {
      labels: monthLabels,
      datasets: [{
        label: 'Requests',
        data: monthLabels.map(m => this.stats!.requestsByMonth[m]),
        backgroundColor: '#8b5cf6',
        borderRadius: 6,
        maxBarThickness: 40
      }]
    };

    // Bar — rating distribution 1★–5★
    const ratingLabels = ['1', '2', '3', '4', '5'];
    const ratingVals = ratingLabels.map(r => this.stats!.ratingDistribution?.[r] ?? 0);
    this.ratingBarData = {
      labels: ratingLabels.map(r => `${r}★`),
      datasets: [{
        label: 'Sessions',
        data: ratingVals,
        backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'],
        borderRadius: 6,
        maxBarThickness: 44
      }]
    };

    // Grouped bar — supply vs demand
    const sdEntries = Object.entries(this.stats.supplyVsDemandByOption || {});
    this.supplyDemandBarData = {
      labels: sdEntries.map(([k]) => k),
      datasets: [
        {
          label: 'Supply (Offer)',
          data: sdEntries.map(([, v]) => v?.[0] ?? 0),
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          maxBarThickness: 28
        },
        {
          label: 'Demand (Seek)',
          data: sdEntries.map(([, v]) => v?.[1] ?? 0),
          backgroundColor: '#ec4899',
          borderRadius: 6,
          maxBarThickness: 28
        }
      ]
    };
  }

  // ── Top mentors helpers ────────────────────────────────────────────────────
  mentorInitials(first: string, last: string): string {
    const a = (first?.[0] ?? '').toUpperCase();
    const b = (last?.[0] ?? '').toUpperCase();
    return (a + b) || '?';
  }

  mentorAvatarColor(first: string, last: string): string {
    const palette = ['#8b5cf6', '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6'];
    const name = `${first}${last}`;
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  }

  starString(rating: number | null): string {
    if (rating == null) return '—';
    return rating.toFixed(1);
  }

  /** Returns the demand-supply gap (positive = demand exceeds supply). */
  supplyDemandGap(): { option: string; gap: number }[] {
    if (!this.stats?.supplyVsDemandByOption) return [];
    return Object.entries(this.stats.supplyVsDemandByOption)
      .map(([k, v]) => ({ option: k, gap: (v?.[1] ?? 0) - (v?.[0] ?? 0) }))
      .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  }

  formatFeedbackDate(date: string): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return date;
    }
  }
}
