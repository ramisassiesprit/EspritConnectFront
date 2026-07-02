import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminEmailService, BirthdaySettings, UpcomingBirthday } from '../../../../../core/services/admin-email.service';

@Component({
  selector: 'app-mailing-birthday',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mailing-birthday.component.html',
  styleUrls: ['./mailing-birthday.component.css']
})
export class MailingBirthdayComponent implements OnInit {
  private adminEmailService = inject(AdminEmailService);

  settings: BirthdaySettings = { enabled: false, template: '' };
  upcomingBirthdays: UpcomingBirthday[] = [];
  loadingSettings = true;
  loadingBirthdays = true;
  saving = false;
  sending = false;
  successMessage = '';
  errorMessage = '';
  sendResult = '';

  ngOnInit() {
    this.loadSettings();
    this.loadUpcomingBirthdays();
  }

  loadSettings() {
    this.loadingSettings = true;
    this.adminEmailService.getBirthdaySettings().subscribe({
      next: (data) => {
        this.settings = data;
        this.loadingSettings = false;
      },
      error: (err) => {
        console.error('Error loading birthday settings', err);
        this.errorMessage = 'Erreur lors du chargement des paramètres.';
        this.loadingSettings = false;
      }
    });
  }

  loadUpcomingBirthdays() {
    this.loadingBirthdays = true;
    this.adminEmailService.getUpcomingBirthdays().subscribe({
      next: (data) => {
        this.upcomingBirthdays = data;
        this.loadingBirthdays = false;
      },
      error: (err) => {
        console.error('Error loading upcoming birthdays', err);
        this.loadingBirthdays = false;
      }
    });
  }

  saveSettings() {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.adminEmailService.updateBirthdaySettings(this.settings).subscribe({
      next: (data) => {
        this.settings = data;
        this.saving = false;
        this.successMessage = 'Paramètres enregistrés avec succès.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Error saving birthday settings', err);
        this.errorMessage = 'Erreur lors de l\'enregistrement.';
        this.saving = false;
      }
    });
  }

  sendToday() {
    this.sending = true;
    this.sendResult = '';
    this.adminEmailService.sendBirthdayEmailsToday().subscribe({
      next: (result) => {
        this.sending = false;
        this.sendResult = `${result.sent} email(s) d'anniversaire envoyé(s) avec succès.`;
        this.loadUpcomingBirthdays();
        setTimeout(() => this.sendResult = '', 5000);
      },
      error: (err) => {
        console.error('Error sending birthday emails', err);
        this.sending = false;
        this.sendResult = 'Erreur lors de l\'envoi des emails.';
      }
    });
  }

  toggleEnabled() {
    this.settings.enabled = !this.settings.enabled;
    this.saveSettings();
  }

  isToday(birthday: UpcomingBirthday): boolean {
    return birthday.isToday;
  }
}
