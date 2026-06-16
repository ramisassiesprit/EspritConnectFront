import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MentoringPreferencesService, MentoringPreferences } from '../../../../core/services/mentoring-preferences.service';

@Component({
  selector: 'app-mentoring-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mentoring-preferences.component.html',
  styleUrl: './mentoring-preferences.component.css'
})
export class MentoringPreferencesComponent {
  private prefsService = inject(MentoringPreferencesService);

  prefs: MentoringPreferences = {
    showOfferHelp: true,
    showSeekHelp: true,
    showOfferMentoring: true,
    showSeekMentoring: true
  };

  saving = false;
  saveMessage = '';
  saveError = false;

  sections: { key: keyof MentoringPreferences; label: string; description: string }[] = [
    { key: 'showOfferHelp', label: 'Offer Help', description: 'Users can offer help to others (introductions, advice, etc.)' },
    { key: 'showSeekHelp', label: 'Seek Help', description: 'Users can seek help from others in the community' },
    { key: 'showOfferMentoring', label: 'Offer Mentoring', description: 'Users can offer to mentor others' },
    { key: 'showSeekMentoring', label: 'Seek Mentoring', description: 'Users can request a mentor' },
  ];

  constructor() {
    this.load();
  }

  load() {
    this.prefsService.getPreferences().subscribe({
      next: (res) => this.prefs = res,
      error: () => {}
    });
  }

  save() {
    this.saving = true;
    this.saveMessage = '';
    this.saveError = false;

    this.prefsService.savePreferences(this.prefs).subscribe({
      next: (res) => {
        this.prefs = res;
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
}
