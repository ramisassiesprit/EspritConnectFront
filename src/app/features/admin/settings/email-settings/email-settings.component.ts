import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface EmailHistoryItem {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  emailType: string;
  sentAt: string;
  status: string;
  errorMessage?: string;
  sentBy?: string;
  hasImage?: boolean;
}

interface EmailStats {
  totalSent: number;
  successful: number;
  failed: number;
  uniqueRecipients: number;
  sentToday: number;
  sentThisMonth: number;
  byType: Record<string, number>;
}

interface UpcomingBirthday {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  isToday: boolean;
  daysUntilBirthday: number;
}

type ActiveTab = 'send' | 'history' | 'birthday';

@Component({
  selector: 'app-email-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './email-settings.component.html',
  styleUrl: './email-settings.component.css'
})
export class EmailSettingsComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}api/admin/email`;

  activeTab: ActiveTab = 'send';

  stats = signal<EmailStats | null>(null);
  history = signal<EmailHistoryItem[]>([]);
  upcomingBirthdays = signal<UpcomingBirthday[]>([]);

  loadingStats = false;
  loadingHistory = false;

  sendModel = {
    to: '',
    subject: '',
    message: '',
    sentBy: 'Admin'
  };
  selectedFile: File | null = null;
  sending = false;
  sendResult: { success: boolean; message: string } | null = null;

  birthdayEnabled = false;
  birthdayTemplate = '';
  savingBirthdaySettings = false;
  birthdayMessage = '';
  sendingBirthdayEmails = false;
  birthdaySentCount = 0;

  filterType = '';
  historyPage = 1;
  pageSize = 20;
  templatePlaceholder = '{{firstName}}';

  ngOnInit(): void {
    this.loadStats();
    this.loadHistory();
    this.loadBirthdaySettings();
    this.loadUpcomingBirthdays();
  }



  loadStats(): void {
    this.loadingStats = true;
    this.http.get<EmailStats>(`${this.apiUrl}/stats`).subscribe({
      next: (s) => { this.stats.set(s); this.loadingStats = false; },
      error: () => this.loadingStats = false
    });
  }

  loadHistory(): void {
    this.loadingHistory = true;
    this.http.get<EmailHistoryItem[]>(`${this.apiUrl}/history`).subscribe({
      next: (h) => { this.history.set(h); this.loadingHistory = false; },
      error: () => this.loadingHistory = false
    });
  }

  loadBirthdaySettings(): void {
    this.http.get<{ enabled: boolean; template: string }>(`${this.apiUrl}/settings/birthday`).subscribe({
      next: (s) => { this.birthdayEnabled = s.enabled; this.birthdayTemplate = s.template; },
      error: () => {}
    });
  }

  loadUpcomingBirthdays(): void {
    this.http.get<UpcomingBirthday[]>(`${this.apiUrl}/birthdays/upcoming`).subscribe({
      next: (b) => this.upcomingBirthdays.set(b),
      error: () => {}
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  sendEmail(): void {
    if (!this.sendModel.to || !this.sendModel.subject || !this.sendModel.message) {
      this.sendResult = { success: false, message: 'Please fill in all required fields.' };
      return;
    }

    this.sending = true;
    this.sendResult = null;

    const formData = new FormData();
    formData.append('to', this.sendModel.to);
    formData.append('subject', this.sendModel.subject);
    formData.append('message', this.sendModel.message);
    formData.append('sentBy', this.sendModel.sentBy);
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.http.post<EmailHistoryItem>(`${this.apiUrl}/send`, formData).subscribe({
      next: (res) => {
        this.sending = false;
        this.sendResult = { success: res.status === 'SENT', message: res.status === 'SENT' ? 'Email sent successfully!' : 'Email failed to send.' };
        if (res.status === 'SENT') {
          this.sendModel = { to: '', subject: '', message: '', sentBy: 'Admin' };
          this.selectedFile = null;
          this.loadStats();
          this.loadHistory();
        }
      },
      error: (err) => {
        this.sending = false;
        this.sendResult = { success: false, message: 'Failed to send email. ' + (err.error?.message || '') };
      }
    });
  }

  saveBirthdaySettings(): void {
    this.savingBirthdaySettings = true;
    this.birthdayMessage = '';
    this.http.put(`${this.apiUrl}/settings/birthday`, {
      enabled: this.birthdayEnabled,
      template: this.birthdayTemplate
    }).subscribe({
      next: () => {
        this.savingBirthdaySettings = false;
        this.birthdayMessage = 'Birthday settings saved!';
        setTimeout(() => this.birthdayMessage = '', 3000);
      },
      error: () => {
        this.savingBirthdaySettings = false;
        this.birthdayMessage = 'Failed to save settings.';
      }
    });
  }

  sendBirthdayEmailsToday(): void {
    if (!confirm('Send birthday emails to all users whose birthday is today?')) return;
    this.sendingBirthdayEmails = true;
    this.http.post<{ sent: number }>(`${this.apiUrl}/birthdays/send-today`, {}).subscribe({
      next: (res) => {
        this.sendingBirthdayEmails = false;
        this.birthdaySentCount = res.sent;
        this.loadUpcomingBirthdays();
        this.loadStats();
        this.loadHistory();
        setTimeout(() => this.birthdaySentCount = 0, 5000);
      },
      error: () => {
        this.sendingBirthdayEmails = false;
      }
    });
  }

  get filteredHistory(): EmailHistoryItem[] {
    let items = this.history();
    if (this.filterType) {
      items = items.filter(i => i.emailType === this.filterType);
    }
    const start = (this.historyPage - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.history().length / this.pageSize);
  }
}
