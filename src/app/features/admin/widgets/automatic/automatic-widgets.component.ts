import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-automatic-widgets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './automatic-widgets.component.html',
  styleUrl: './automatic-widgets.component.css'
})
export class AutomaticWidgetsComponent {
  // Social Media State
  isSocialMediaExpanded = true;
  
  facebookLinks: string[] = [
    'https://www.facebook.com/esprit.tn',
    'https://www.facebook.com/ESBEsprit',
    'https://www.facebook.com/EspritMonastir'
  ];
  youtubeLinks: string[] = [];
  xLinks: string[] = [];

  // Toggles State
  profileUpdateReminder = true;
  profileUpdateInterval = 2;
  profileUpdateUnit = 'Weeks';
  
  donationsEnabled = false;
  recentlyJoinedMembers = true;
  eventsAndJobsLanding = true;

  // Social Media Actions
  toggleSocialMedia() {
    this.isSocialMediaExpanded = !this.isSocialMediaExpanded;
  }

  addFacebookLink() {
    this.facebookLinks.push('');
  }

  removeFacebookLink(index: number) {
    this.facebookLinks.splice(index, 1);
  }

  addYoutubeLink() {
    this.youtubeLinks.push('');
  }

  removeYoutubeLink(index: number) {
    this.youtubeLinks.splice(index, 1);
  }

  addXLink() {
    this.xLinks.push('');
  }

  removeXLink(index: number) {
    this.xLinks.splice(index, 1);
  }

  saveSocialMedia() {
    console.log('Saving Social Media:', {
      facebook: this.facebookLinks,
      youtube: this.youtubeLinks,
      x: this.xLinks
    });
    // Add toast or notification here in a real app
  }

  saveProfileUpdateReminder() {
    console.log('Saving Profile Update Reminder:', {
      enabled: this.profileUpdateReminder,
      interval: this.profileUpdateInterval,
      unit: this.profileUpdateUnit
    });
  }
}
// Trigger rebuild

