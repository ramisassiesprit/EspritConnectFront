import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WillingToHelp } from '../../../core/models/profile.model';
import { MentoringPreferencesService } from '../../../core/services/mentoring-preferences.service';

@Component({
  selector: 'app-help-mentoring-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './help-mentoring-form.component.html',
  styleUrl: './help-mentoring-form.component.css'
})
export class HelpMentoringFormComponent implements OnInit {
  private prefsService = inject(MentoringPreferencesService);

  @Input() initialHelp?: WillingToHelp;
  @Output() save = new EventEmitter<WillingToHelp>();
  @Output() cancel = new EventEmitter<void>();

  showOfferHelp = true;
  showSeekHelp = true;
  showOfferMentoring = true;
  showSeekMentoring = true;

  offerHelpOptions: string[] = [];
  seekHelpOptions: string[] = [];
  offerMentoringOptions: string[] = [];
  seekMentoringOptions: string[] = [];

  readonly allHelpOptions = [
    'Introduction to connections',
    'Answer industry specific questions',
    'Open doors at workplace',
    'Meet for coffee'
  ];

  readonly allMentoringOptions = [
    'Mentor a young professional',
    'Mentor a student',
    'Career advice',
    'Resume review',
    'Internship'
  ];

  helpSelections = {
    offerHelp: {} as { [key: string]: boolean },
    seekHelp: {} as { [key: string]: boolean },
    offerMentoring: {} as { [key: string]: boolean },
    seekMentoring: {} as { [key: string]: boolean }
  };

  ngOnInit(): void {
    this.initHelpSelections();
    this.prefsService.getPreferences().subscribe({
      next: (prefs) => {
        this.showOfferHelp = prefs.showOfferHelp;
        this.showSeekHelp = prefs.showSeekHelp;
        this.showOfferMentoring = prefs.showOfferMentoring;
        this.showSeekMentoring = prefs.showSeekMentoring;

        this.offerHelpOptions = this.resolveOptions(prefs.offerHelpOptions, this.allHelpOptions);
        this.seekHelpOptions = this.resolveOptions(prefs.seekHelpOptions, this.allHelpOptions);
        this.offerMentoringOptions = this.resolveOptions(prefs.offerMentorOptions, this.allMentoringOptions);
        this.seekMentoringOptions = this.resolveOptions(prefs.seekMentorOptions, this.allMentoringOptions);
      }
    });
  }

  private resolveOptions(configured: string[] | undefined | null, all: string[]): string[] {
    if (configured === undefined || configured === null) return all;
    return all.filter(opt => configured.includes(opt));
  }

  initHelpSelections(): void {
    const help = this.initialHelp || { 
      offerHelp: '', 
      seekHelp: '', 
      offerMentor: '', 
      seekMentor: '' 
    };
    
    const offerHelps = (help.offerHelp || '').split(',').map(s => s.trim());
    const seekHelps = (help.seekHelp || '').split(',').map(s => s.trim());
    const offerMentors = (help.offerMentor || '').split(',').map(s => s.trim());
    const seekMentors = (help.seekMentor || '').split(',').map(s => s.trim());

    this.helpSelections.offerHelp = {};
    this.allHelpOptions.forEach(opt => this.helpSelections.offerHelp[opt] = offerHelps.includes(opt));
    
    this.helpSelections.seekHelp = {};
    this.allHelpOptions.forEach(opt => this.helpSelections.seekHelp[opt] = seekHelps.includes(opt));

    this.helpSelections.offerMentoring = {};
    this.allMentoringOptions.forEach(opt => this.helpSelections.offerMentoring[opt] = offerMentors.includes(opt));

    this.helpSelections.seekMentoring = {};
    this.allMentoringOptions.forEach(opt => this.helpSelections.seekMentoring[opt] = seekMentors.includes(opt));
  }

  onSave(): void {
    const offerHelpArr = Object.keys(this.helpSelections.offerHelp).filter(k => this.helpSelections.offerHelp[k]);
    const seekHelpArr = Object.keys(this.helpSelections.seekHelp).filter(k => this.helpSelections.seekHelp[k]);
    
    const offerMentorArr = Object.keys(this.helpSelections.offerMentoring).filter(k => this.helpSelections.offerMentoring[k]);
    const seekMentorArr = Object.keys(this.helpSelections.seekMentoring).filter(k => this.helpSelections.seekMentoring[k]);

    const result: WillingToHelp = {
      ...(this.initialHelp || {} as WillingToHelp),
      offerHelp: offerHelpArr.join(', '),
      seekHelp: seekHelpArr.join(', '),
      offerMentor: offerMentorArr.join(', '),
      seekMentor: seekMentorArr.join(', ')
    };

    this.save.emit(result);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
