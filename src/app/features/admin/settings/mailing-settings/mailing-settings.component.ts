import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MailingSettings, MailingSettingsService } from '../../../../core/services/mailing-settings.service';

@Component({
  selector: 'app-mailing-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mailing-settings.component.html',
  styleUrl: './mailing-settings.component.css'
})
export class MailingSettingsComponent implements OnInit {
  private mailingSettingsService = inject(MailingSettingsService);

  settings: MailingSettings = {
    authEmailsEnabled: true,
    eventEmailsEnabled: true,
    mentoringEmailsEnabled: true,
    videoChatEmailsEnabled: true
  };

  loading = true;
  saving = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.loading = true;
    this.mailingSettingsService.getSettings().subscribe({
      next: (data) => {
        this.settings = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading mailing settings', err);
        this.errorMessage = 'Erreur lors du chargement des paramètres.';
        this.loading = false;
      }
    });
  }

  saveSettings() {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.mailingSettingsService.saveSettings(this.settings).subscribe({
      next: (data) => {
        this.settings = data;
        this.saving = false;
        this.successMessage = 'Paramètres enregistrés avec succès.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Error saving mailing settings', err);
        this.errorMessage = 'Erreur lors de l\'enregistrement des paramètres.';
        this.saving = false;
      }
    });
  }
}
