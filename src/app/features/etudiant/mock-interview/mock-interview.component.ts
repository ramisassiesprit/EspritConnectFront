import { Component } from '@angular/core';
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
export class MockInterviewComponent {
  jobDescription: string = '';
  questions: string[] = [];
  currentQuestionIndex: number = 0;
  userAnswer: string = '';
  answers: {question: string, answer: string}[] = [];
  
  isLoading: boolean = false;
  scorecard: any = null;

  constructor(private http: HttpClient) {}

  generateQuestions() {
    if (!this.jobDescription) return;
    this.isLoading = true;
    this.http.post<any>(`${environment.apiUrl}interviews/generate-questions`, { jobDescription: this.jobDescription })
      .subscribe({
        next: (res) => {
          if (res.questions) {
            this.questions = res.questions;
            this.currentQuestionIndex = 0;
            this.answers = [];
            this.scorecard = null;
          }
          this.isLoading = false;
        },
        error: () => this.isLoading = false
      });
  }

  nextQuestion() {
    this.answers.push({
      question: this.questions[this.currentQuestionIndex],
      answer: this.userAnswer
    });
    this.userAnswer = '';
    
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    } else {
      this.evaluate();
    }
  }

  evaluate() {
    this.isLoading = true;
    this.http.post<any>(`${environment.apiUrl}/interviews/evaluate`, { qna: this.answers })
      .subscribe({
        next: (res) => {
          this.scorecard = res;
          this.isLoading = false;
        },
        error: () => this.isLoading = false
      });
  }
}
