import Swal from 'sweetalert2';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../core/services/profile.service';
import { UserService } from '../../../core/services/User.service';
import { EspritProfile, WorkExperience, OtherEducation, Skill, WillingToHelp } from '../../../core/models/profile.model';
import { User, UserStatus } from '../../../core/models/user.model';
import { UserRole } from '../../../core/models/user-role.enum';
import { HelpMentoringFormComponent } from '../../../shared/components/help-mentoring-form/help-mentoring-form.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HelpMentoringFormComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private userService = inject(UserService);

  user: User = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    role: UserRole.ETUDIANT,
    status: UserStatus.ACTIVE,
    cvUrl:''
  };

  espritProfile: EspritProfile = {
    studentNumber: '',
    fieldOfStudy: '',
    degree: '',
    graduationYear: new Date().getFullYear(),
    program: '',
    institution: ''
  };

  experiences: WorkExperience[] = [];
  educations: OtherEducation[] = [];
  skills: Skill[] = [];
  helps: WillingToHelp[] = [{
    offerHelp: '',
    seekHelp: '',
    offerMentor: '',
    seekMentor: ''
  }];
  isEditingHelp: boolean = false;

  newExperience: WorkExperience = this.resetExperience();
  newEducation: OtherEducation = this.resetEducation();
  newSkillName: string = '';
  newHelp: WillingToHelp = this.resetHelp();

  isEditingProfile: boolean = false;
  isEditingEsprit: boolean = false;
  avatarPreviewUrl: string | null = null;
  hasPendingAvatarSave: boolean = false;

  cvFile: File | null = null;
  isUploadingCv: boolean = false;

  programOptions = [
    { value: 'ESE-ESPRIT School of Engineering', label: 'ESE - ESPRIT School of Engineering' },
    { value: 'ESB-Esprit school of business', label: 'ESB - Esprit School of Business' },
    { value: 'ESM-Esprim Monastir', label: 'ESM - Esprim Monastir' },
    { value: 'Evening classes', label: 'Evening classes' },
    { value: 'dual studies', label: 'dual studies' }
  ];

  isProgramSelected(option: string): boolean {
    if (!this.espritProfile.program) return false;
    const selected = this.espritProfile.program.split(',').map(s => s.trim());
    return selected.includes(option);
  }

  toggleProgramOption(option: string): void {
    let selected = this.espritProfile.program 
      ? this.espritProfile.program.split(',').map(s => s.trim()).filter(s => s !== '')
      : [];
    
    if (selected.includes(option)) {
      selected = selected.filter(s => s !== option);
    } else {
      selected.push(option);
    }
    
    this.espritProfile.program = selected.join(',');
  }


  showAddExperience: boolean = false;
  showAddSkill: boolean = false;
  showAddEducation: boolean = false;

  ngOnInit(): void {
    this.loadAllData();
  }

  toggleEditHelp(): void {
    this.isEditingHelp = !this.isEditingHelp;
  }

  onHelpSaved(updatedHelp: WillingToHelp): void {
    if (updatedHelp.id) {
      this.profileService.updateHelp(updatedHelp.id, updatedHelp).subscribe(h => {
        this.helps[0] = h;
        this.isEditingHelp = false;
      });
    } else {
      this.profileService.addHelp(updatedHelp).subscribe(h => {
        this.helps = [h];
        this.isEditingHelp = false;
      });
    }
  }


  toggleEditProfile(): void {
    this.isEditingProfile = !this.isEditingProfile;
    if (!this.isEditingProfile) {
      this.loadAllData();
    }
  }

  toggleEditEsprit(): void {
    this.isEditingEsprit = !this.isEditingEsprit;
    if (!this.isEditingEsprit) {
      this.loadAllData();
    }
  }

  toggleAddExperience(): void {
    this.showAddExperience = !this.showAddExperience;
  }

  toggleAddSkill(): void {
    this.showAddSkill = !this.showAddSkill;
  }

  toggleAddEducation(): void {
    this.showAddEducation = !this.showAddEducation;
  }

  loadAllData(): void {
    this.userService.getCurrentUser().subscribe(u => this.user = u);
    this.profileService.getMyEspritProfile().subscribe(p => {
      this.espritProfile = p ? p : {
        studentNumber: '',
        fieldOfStudy: '',
        degree: '',
        graduationYear: new Date().getFullYear(),
        program: '',
        institution: ''
      };
    });
    this.profileService.getMyExperiences().subscribe(exps => this.experiences = exps);
    this.profileService.getMyEducations().subscribe(edus => this.educations = edus);
    this.profileService.getMySkills().subscribe(skills => this.skills = skills);
    this.profileService.getMyHelps().subscribe(helps => {
      this.helps = helps && helps.length > 0 ? helps : [this.resetHelp()];
    });
  }

  updateProfile(): void {
    this.userService.updateProfile(this.user).subscribe(u => {
      this.user = u;
      this.avatarPreviewUrl = null;
      this.hasPendingAvatarSave = false;
      this.isEditingProfile = false;
      Swal.fire('Informations personnelles mises à jour !');
    });
  }

  saveAvatar(): void {
    if (!this.hasPendingAvatarSave || !this.avatarPreviewUrl) {
      return;
    }

    this.user.avatarUrl = this.avatarPreviewUrl;
    this.userService.updateProfile(this.user).subscribe(u => {
      this.user = u;
      this.avatarPreviewUrl = null;
      this.hasPendingAvatarSave = false;
      Swal.fire('Photo de profil mise à jour !');
    });
  }

  updateEspritProfile(): void {
    this.profileService.updateEspritProfile(this.espritProfile).subscribe(p => {
    console.log(p);
      this.espritProfile = p;
      this.isEditingEsprit = false;
      Swal.fire('Profil Esprit mis à jour !');
    });
  }

  addExperience(): void {
    this.profileService.addExperience(this.newExperience).subscribe(exp => {
      this.experiences.push(exp);
      this.newExperience = this.resetExperience();
      this.showAddExperience = false;
    });
  }

  deleteExperience(id: string | undefined): void {
    if (!id) return;
    this.profileService.deleteExperience(id).subscribe(() => {
      this.experiences = this.experiences.filter(e => e.id !== id);
    });
  }

  addEducation(): void {
    this.profileService.addEducation(this.newEducation).subscribe(edu => {
      this.educations.push(edu);
      this.newEducation = this.resetEducation();
      this.showAddEducation = false;
    });
  }

  addSkill(): void {
    if (!this.newSkillName.trim()) return;
    this.profileService.addSkill(this.newSkillName).subscribe(() => {
      this.profileService.getMySkills().subscribe(skills => this.skills = skills);
      this.newSkillName = '';
      this.showAddSkill = false;
    });
  }

  deleteSkill(id: string | undefined): void {
    if (!id) return;
    this.profileService.deleteSkill(id).subscribe(() => {
      this.skills = this.skills.filter(s => s.id !== id);
    });
  }

  addHelp(): void {
    this.profileService.addHelp(this.newHelp).subscribe(help => {
      this.helps.push(help);
      this.newHelp = this.resetHelp();
    });
  }

  deleteHelp(id: string | undefined): void {
    if (!id) return;
    this.profileService.deleteHelp(id).subscribe(() => {
      this.helps = this.helps.filter(h => h.id !== id);
    });
  }
  
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreviewUrl = e.target.result;
        this.hasPendingAvatarSave = true;
      };
      reader.readAsDataURL(file);
    }
  }

  onCvSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.cvFile = file;
    }
  }

  uploadCv(): void {
    if (!this.cvFile) return;
    this.isUploadingCv = true;
    this.userService.uploadCv(this.cvFile).subscribe({
      next: (res) => {
        this.isUploadingCv = false;
        this.user.cvUrl = res.cvUrl; // Update local user model
        this.cvFile = null;
        Swal.fire('Succès', 'Votre CV a été uploadé avec succès !', 'success');
      },
      error: (err) => {
        this.isUploadingCv = false;
        Swal.fire('Erreur', 'Erreur lors de l\'upload du CV', 'error');
        console.error(err);
      }
    });
  }

  private resetExperience(): WorkExperience {
    return {
      company: '',
      jobTitle: '',
      industry: '',
      jobFunction: '',
      startDate: '',
      isCurrent: false,
      description: ''
    };
  }

  private resetEducation(): OtherEducation {
    return {
      institutionName: '',
      degree: '',
      graduationYear: new Date().getFullYear()
    };
  }

  private resetHelp(): WillingToHelp {
    return {
      offerHelp: '',
      seekHelp: '',
      offerMentor: '',
      seekMentor: ''
    };
  }
  deleteEducation(id: string | undefined): void {
  if (!id) return;

  this.profileService.deleteEducation(id).subscribe(() => {
    this.educations = this.educations.filter(e => e.id !== id);
  });
}
}
