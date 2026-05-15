import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpMentoringFormComponent } from '../../../../shared/components/help-mentoring-form/help-mentoring-form.component';
import { ProfileService } from '../../../../core/services/profile.service';
import { WillingToHelp } from '../../../../core/models/profile.model';

@Component({
  selector: 'app-mentoring-settings',
  standalone: true,
  imports: [CommonModule, HelpMentoringFormComponent],
  templateUrl: './mentoringSettings.component.html',
})
export class MentoringSettingsComponent implements OnInit {
  private profileService = inject(ProfileService);
  helpData?: WillingToHelp;
  isLoaded = false;

  ngOnInit(): void {
    this.loadHelpData();
  }

  loadHelpData(): void {
    this.profileService.getMyHelps().subscribe(helps => {
      if (helps && helps.length > 0) {
        this.helpData = helps[0];
      }
      this.isLoaded = true;
    });
  }

  onSave(updatedHelp: WillingToHelp): void {
    if (updatedHelp.id) {
      this.profileService.updateHelp(updatedHelp.id, updatedHelp).subscribe(() => {
        alert('Settings updated successfully!');
      });
    } else {
      this.profileService.addHelp(updatedHelp).subscribe(h => {
        this.helpData = h;
        alert('Settings saved successfully!');
      });
    }
  }

  onCancel(): void {
    console.log('Cancelled');
  }
}
