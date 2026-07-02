import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminEmailService, EmailHistory } from '../../../../../core/services/admin-email.service';

@Component({
  selector: 'app-mailing-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mailing-history.component.html',
  styleUrls: ['./mailing-history.component.css']
})
export class MailingHistoryComponent implements OnInit {
  private adminEmailService = inject(AdminEmailService);

  history: EmailHistory[] = [];
  loading = true;
  errorMessage = '';

  selectedEmail: EmailHistory | null = null;

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.loading = true;
    this.adminEmailService.getHistory().subscribe({
      next: (data) => {
        this.history = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading email history', err);
        this.errorMessage = 'Erreur lors du chargement de l\'historique.';
        this.loading = false;
      }
    });
  }

  viewDetails(email: EmailHistory) {
    this.selectedEmail = this.selectedEmail?.id === email.id ? null : email;
  }

  getStatusClass(status: string): string {
    return status === 'SENT' ? 'status-sent' : 'status-failed';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'ADMIN': 'Administration',
      'BIRTHDAY': 'Anniversaire',
      'CUSTOM': 'Personnalisé'
    };
    return labels[type] || type;
  }
}
