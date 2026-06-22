import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MentoringPreferencesService, MentoringPreferences } from '../../../../core/services/mentoring-preferences.service';

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
}
