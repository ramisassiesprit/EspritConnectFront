import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-case-metrics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './case-metrics.component.html',
  styleUrl: './case-metrics.component.css'
})
export class CaseMetricsComponent implements OnInit {

  startDate = '';
  endDate = '';
  affiliation = 'Student, Alumni, Company, Teache...';

  communicationsCount = 2577;
  volunteerCount = 1828;
  experientialCount = 3191;

  ngOnInit() {
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    this.endDate = this.formatDate(today);
    this.startDate = this.formatDate(oneYearAgo);
  }

  applyFilters() {
    // In a real scenario, this would fetch new data based on filters
    console.log('Filters applied:', {
      startDate: this.startDate,
      endDate: this.endDate,
      affiliation: this.affiliation
    });
  }

  printReport() {
    window.print();
  }

  downloadCommunications() {
    this.downloadDummyCsv('Communications');
  }

  downloadVolunteer() {
    this.downloadDummyCsv('Volunteer');
  }

  downloadExperiential() {
    this.downloadDummyCsv('Experiential');
  }

  private downloadDummyCsv(category: string) {
    const csv = `Category,Value\n${category},Data\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category.toLowerCase()}-metrics.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
// Trigger rebuild

