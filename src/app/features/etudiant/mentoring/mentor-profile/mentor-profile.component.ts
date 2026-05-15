import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UserService } from '../../../../core/services/User.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { BadgeService } from '../../../../core/services/badge.service';
import { switchMap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-mentor-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mentor-profile.component.html',
  styleUrls: ['./mentor-profile.component.css']
})
export class MentorProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private profileService = inject(ProfileService);
  private badgeService = inject(BadgeService);

  user: any = null;
  profile: any = null;
  experiences: any[] = [];
  educations: any[] = [];
  skills: any[] = [];
  helps: any = null;

  isLoading = true;

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) return of(null);
        return forkJoin({
          user: this.userService.getUserById(id),
          profile: this.profileService.getEspritProfileByUserId(id),
          experiences: this.profileService.getWorkExperiencesByUserId(id),
          educations: this.profileService.getEducationsByUserId(id),
          helps: this.profileService.getWillingToHelpsByUserId(id),
        });
      })
    ).subscribe({
      next: (res: any) => {
        if (!res) {
          this.isLoading = false;
          return;
        }
        this.user = res.user;
        this.profile = res.profile;
        this.experiences = res.experiences || [];
        this.educations = res.educations || [];
        this.helps = (res.helps && res.helps.length > 0) ? res.helps[0] : null;

        // Parse helps if needed since it's a string of comma separated values usually
        if (this.helps) {
          this.helps.offerHelpList = this.helps.offerHelp ? this.helps.offerHelp.split(', ') : [];
          this.helps.seekHelpList = this.helps.seekHelp ? this.helps.seekHelp.split(', ') : [];
          this.helps.offerMentorList = this.helps.offerMentor ? this.helps.offerMentor.split(', ') : [];
          this.helps.seekMentorList = this.helps.seekMentor ? this.helps.seekMentor.split(', ') : [];
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }
}

