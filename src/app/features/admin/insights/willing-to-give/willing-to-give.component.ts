import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface QuestionBar {
  label: string;
  offer: number;
  request: number;
}

@Component({
  selector: 'app-willing-to-give',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './willing-to-give.component.html',
  styleUrl: './willing-to-give.component.css'
})
export class WillingToGiveComponent {

  // Willing to help questions data
  helpQuestions: QuestionBar[] = [
    { label: 'Meet for coffee', offer: 5327, request: 5196 },
    { label: 'Answer industry specific questions', offer: 5985, request: 6146 },
    { label: 'Open doors at workplace', offer: 6579, request: 7207 },
    { label: 'Introduction to connections', offer: 6729, request: 7533 }
  ];

  // Mentoring questions data
  mentoringQuestions: QuestionBar[] = [
    { label: 'Career advice', offer: 2610, request: 6759 },
    { label: 'Mentor a young professional', offer: 2169, request: 5342 },
    { label: 'Internship', offer: 3587, request: 8167 },
    { label: 'Resume review', offer: 2510, request: 6483 },
    { label: 'Mentor a student', offer: 4790, request: 5678 }
  ];

  get maxHelpValue(): number {
    return Math.max(...this.helpQuestions.map(q => Math.max(q.offer, q.request)), 1);
  }

  get maxMentoringValue(): number {
    return Math.max(...this.mentoringQuestions.map(q => Math.max(q.offer, q.request)), 1);
  }

  helpBarWidth(value: number): number {
    return Math.max((value / this.maxHelpValue) * 100, 5);
  }

  mentoringBarWidth(value: number): number {
    return Math.max((value / this.maxMentoringValue) * 100, 5);
  }

  downloadHelpCsv() {
    let csv = 'Question,Offer Help,Request Help\n';
    this.helpQuestions.forEach(q => {
      csv += `"${q.label}",${q.offer},${q.request}\n`;
    });
    this.downloadFile(csv, 'willing-to-help-questions.csv');
  }

  downloadMentoringCsv() {
    let csv = 'Question,Offer Mentoring,Request Mentoring\n';
    this.mentoringQuestions.forEach(q => {
      csv += `"${q.label}",${q.offer},${q.request}\n`;
    });
    this.downloadFile(csv, 'mentoring-questions.csv');
  }

  private downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
