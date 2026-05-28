import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../core/services/User.service';
import { ProfileService } from '../../../core/services/profile.service';
import { User } from '../../../core/models/user.model';
import { EspritProfile, WorkExperience, OtherEducation, Skill, WillingToHelp } from '../../../core/models/profile.model';
import { RequestHelpModalComponent } from './request-help-modal/request-help-modal.component';
import { OfferHelpModalComponent } from './offer-help-modal/offer-help-modal.component';
import { VideoChatModalComponent } from './video-chat-modal/video-chat-modal.component';
import { MentorshipService } from '../../../core/services/mentorship.service';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, RouterModule, RequestHelpModalComponent, OfferHelpModalComponent, VideoChatModalComponent],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css'
})
export class UserDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private profileService = inject(ProfileService);
  private mentorshipService = inject(MentorshipService);

  user?: User;
  espritProfile?: EspritProfile;
  experiences: WorkExperience[] = [];
  educations: OtherEducation[] = [];
  skills: Skill[] = [];
  willingToHelps: WillingToHelp[] = [];
  loading = true;

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      forkJoin({
        user: this.userService.getUserById(userId),
        esprit: this.profileService.getEspritProfileByUserId(userId),
        experiences: this.profileService.getWorkExperiencesByUserId(userId),
        educations: this.profileService.getEducationsByUserId(userId),
        skills: this.profileService.getSkillsByUserId(userId),
        helps: this.profileService.getWillingToHelpsByUserId(userId)
      }).subscribe({
        next: (data) => {
          this.user = data.user;
          this.espritProfile = data.esprit;
          this.experiences = data.experiences;
          this.educations = data.educations;
          this.skills = data.skills;
          this.willingToHelps = data.helps;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching user details', err);
          this.loading = false;
        }
      });
    }
  }

  getOfferMentoringItems(): string[] {
    return this.willingToHelps
      .filter(h => h.offerMentor)
      .map(h => h.offerMentor!)
      .flatMap(s => s.split(',').map(i => i.trim()))
      .filter(Boolean);
  }

  getSeekMentoringItems(): string[] {
    return this.willingToHelps
      .filter(h => h.seekMentor)
      .map(h => h.seekMentor!)
      .flatMap(s => s.split(',').map(i => i.trim()))
      .filter(Boolean);
  }

  getOfferHelpItems(): string[] {
    return this.willingToHelps
      .filter(h => h.offerHelp)
      .map(h => h.offerHelp!)
      .flatMap(s => s.split(',').map(i => i.trim()))
      .filter(Boolean);
  }

  getSeekHelpItems(): string[] {
    return this.willingToHelps
      .filter(h => h.seekHelp)
      .map(h => h.seekHelp!)
      .flatMap(s => s.split(',').map(i => i.trim()))
      .filter(Boolean);
  }

  formatDate(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
  }

  // Modals state
  isRequestHelpModalOpen = false;
  isOfferHelpModalOpen = false;
  isVideoChatModalOpen = false;

  openVideoChatModal() {
    this.isVideoChatModalOpen = true;
  }

  closeVideoChatModal() {
    this.isVideoChatModalOpen = false;
  }

  handleVideoChatScheduled(event: any) {
    console.log('Video chat scheduled!', event);
  }

  openRequestHelpModal() {
    this.isRequestHelpModalOpen = true;
  }

  closeRequestHelpModal() {
    this.isRequestHelpModalOpen = false;
  }

  handleSendRequestHelp(data: { type: string, message: string }) {
    this.closeRequestHelpModal();
    if (this.user) {
      const formattedHtml = `<p><strong>Help Request: ${data.type}</strong></p><br/>${data.message}`;
      this.router.navigate(['/etudiant/chat', this.user.id], {
        state: { autoSendMsg: formattedHtml }
      });
    }
  }

  openOfferHelpModal() {
    this.isOfferHelpModalOpen = true;
  }

  closeOfferHelpModal() {
    this.isOfferHelpModalOpen = false;
  }

  handleSendOfferHelp(data: { type: string, message: string }) {
    this.closeOfferHelpModal();
    if (this.user) {
      const formattedHtml = `<p><strong>Help Offer: ${data.type}</strong></p><br/>${data.message}`;
      this.router.navigate(['/etudiant/chat', this.user.id], {
        state: { autoSendMsg: formattedHtml }
      });
    }
  }

  requestMentoring() {
    if (!this.user) return;
    this.mentorshipService.createRequest(this.user.id)
      .subscribe({
        next: () => {
          // navigate to mentoring relations where requests appear
          this.router.navigate(['/etudiant/mentoring/relations']);
        },
        error: (err) => {
          console.error('Failed to create mentoring request', err);
          alert(err?.error?.message || 'Failed to send mentoring request');
        }
      });
  }

  offerMentoring() {
    if (!this.user) return;
    this.mentorshipService.createOffer(this.user.id)
      .subscribe({
        next: () => {
          this.router.navigate(['/etudiant/mentoring/relations']);
        },
        error: (err) => {
          console.error('Failed to create mentoring offer', err);
          alert(err?.error?.message || 'Failed to send mentoring offer');
        }
      });
  }
}
