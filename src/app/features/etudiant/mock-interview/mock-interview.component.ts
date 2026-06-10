import Swal from 'sweetalert2';
import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-mock-interview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mock-interview.component.html',
  styleUrls: ['./mock-interview.component.css']
})

export class MockInterviewComponent implements AfterViewChecked {
  @ViewChild('cardContainer') cardContainer!: ElementRef;
  // Track if we need to scroll after view updates
  private shouldScroll = false;

  // Simple markdown bold conversion ( **text** -> <strong>text</strong> )
  formatText(text: string): string {
    if (!text) return '';
    // Escape HTML first to avoid XSS, then replace markdown bold
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  ngAfterViewChecked() {
    if (this.shouldScroll && this.cardContainer) {
      // Scroll to bottom of the container smoothly
      this.cardContainer.nativeElement.scrollTo({ top: this.cardContainer.nativeElement.scrollHeight, behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  // Call this after adding an answer to trigger scroll
  nextQuestion() {
    this.answers.push({
      question: this.questions[this.currentQuestionIndex],
      answer: this.userAnswer
    });
    this.userAnswer = '';
    this.shouldScroll = true;
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    } else {
      this.evaluate();
    }
  }

  // Existing constructor and other methods remain unchanged

  jobDescription: string = '';
  questions: string[] = [];
  currentQuestionIndex: number = 0;
  userAnswer: string = '';
  answers: {question: string, answer: string}[] = [];
  
  isLoading: boolean = false;
  scorecard: any = null;

  constructor(private http: HttpClient) {}

  generateQuestions() {
    if (!this.jobDescription.trim()) return;
    this.isLoading = true;

    this.http.post<any>(`${environment.apiUrl}interviews/generate-questions`, { jobDescription: this.jobDescription })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res && res.questions && Array.isArray(res.questions) && res.questions.length > 0) {
            this.questions = res.questions;
            this.currentQuestionIndex = 0;
            this.answers = [];
            this.scorecard = null;
          } else if (res && res.error) {
            Swal.fire('Erreur IA', res.error, 'error');
          } else {
            Swal.fire('Erreur', 'L\'IA n\'a pas pu générer de questions. Réessayez.', 'warning');
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Erreur génération questions:', err);
          Swal.fire('Erreur Serveur', `Impossible de contacter le serveur (${err.status || 'inconnu'})`, 'error');
        }
      });
  }

  

  evaluate() {
    this.isLoading = true;
    this.http.post<any>(`${environment.apiUrl}interviews/evaluate`, { qna: this.answers })
      .subscribe({
        next: (res) => {
          this.scorecard = res;
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Erreur évaluation:', err);
          Swal.fire('Erreur', 'Impossible d\'évaluer vos réponses.', 'error');
        }
      });
  }
}
