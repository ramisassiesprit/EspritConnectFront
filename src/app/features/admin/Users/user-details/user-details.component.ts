import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../../../core/services/User.service';
import { User, UserStatus, EspritProfile, WorkExperience, OtherEducation, Skill, WillingToHelp } from '../../../../core/models/user.model';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css'
})
export class UserDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private location = inject(Location);

  user: User | null = null;
  espritProfile?: EspritProfile;
  experiences: WorkExperience[] = [];
  educations: OtherEducation[] = [];
  skills: Skill[] = [];
  willingToHelps: WillingToHelp[] = [];
  
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadUserDetails(id);
      } else {
        this.error = "ID d'utilisateur manquant";
        this.loading = false;
      }
    });
  }

  loadUserDetails(id: string) {
    this.loading = true;
    this.error = null;
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.user = user;
        this.espritProfile = user.espritProfile;
        this.experiences = user.workExperiences || [];
        this.educations = user.otherEducations || [];
        this.skills = user.skills || [];
        this.willingToHelps = user.willingToHelps || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading user details', err);
        this.error = "Impossible de charger les détails de l'utilisateur.";
        this.loading = false;
      }
    });
  }

  goBack() {
    this.location.back();
  }

  acceptUser() {
    if (!this.user) return;
    this.userService.updateUserStatus(this.user.id, UserStatus.ACTIVE).subscribe({
      next: () => {
        if (this.user) {
          this.user.status = UserStatus.ACTIVE;
        }
      },
      error: (err) => console.error('Error accepting user', err)
    });
  }

  rejectUser() {
    if (!this.user) return;
    this.userService.updateUserStatus(this.user.id, UserStatus.REJECTED).subscribe({
      next: () => {
        if (this.user) {
          this.user.status = UserStatus.REJECTED;
        }
      },
      error: (err) => console.error('Error rejecting user', err)
    });
  }

  getStatusClass(status?: UserStatus): string {
    if (!status) return '';
    switch (status) {
      case UserStatus.ACTIVE: return 'status-active';
      case UserStatus.PENDING: return 'status-pending';
      case UserStatus.REJECTED: return 'status-rejected';
      default: return '';
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

  formatDate(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
  }
}
