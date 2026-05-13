import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../core/services/profile.service';
import { UserService } from '../../../core/services/User.service';
import { EspritProfile, WorkExperience, OtherEducation, Skill, WillingToHelp } from '../../../core/models/profile.model';
import { User, UserStatus } from '../../../core/models/user.model';
import { UserRole } from '../../../core/models/user-role.enum';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
    status: UserStatus.ACTIVE
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
  helps: WillingToHelp[] = [];
  isEditingHelp: boolean = false;

  helpOptions = [
    'Introduction to connections',
    'Answer industry specific questions',
    'Open doors at workplace',
    'Meet for coffee'
  ];

  mentoringOptions = [
    'Mentor a young professional',
    'Mentor a student',
    'Career advice',
    'Resume review',
    'Internship'
  ];

  // Helper object to manage checkbox states
  helpSelections = {
    offerHelp: {} as { [key: string]: boolean },
    seekHelp: {} as { [key: string]: boolean },
    offerMentoring: {} as { [key: string]: boolean },
    seekMentoring: {} as { [key: string]: boolean }
  };

  newExperience: WorkExperience = this.resetExperience();
  newEducation: OtherEducation = this.resetEducation();
  newSkillName: string = '';
  newHelp: WillingToHelp = this.resetHelp();

  isEditingProfile: boolean = false;
  isEditingEsprit: boolean = false;

  showAddExperience: boolean = false;
  showAddSkill: boolean = false;
  showAddEducation: boolean = false;

  ngOnInit(): void {
    this.loadAllData();
  }

  toggleEditHelp(): void {
    this.isEditingHelp = !this.isEditingHelp;
    if (this.isEditingHelp) {
      this.initHelpSelections();
    }
  }

  initHelpSelections(): void {
    const help = this.helps[0] || { 
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
    this.helpOptions.forEach(opt => this.helpSelections.offerHelp[opt] = offerHelps.includes(opt));
    
    this.helpSelections.seekHelp = {};
    this.helpOptions.forEach(opt => this.helpSelections.seekHelp[opt] = seekHelps.includes(opt));

    this.helpSelections.offerMentoring = {};
    this.mentoringOptions.forEach(opt => this.helpSelections.offerMentoring[opt] = offerMentors.includes(opt));

    this.helpSelections.seekMentoring = {};
    this.mentoringOptions.forEach(opt => this.helpSelections.seekMentoring[opt] = seekMentors.includes(opt));
  }

  saveHelpSelections(): void {
    const offerHelpArr = Object.keys(this.helpSelections.offerHelp).filter(k => this.helpSelections.offerHelp[k]);
    const seekHelpArr = Object.keys(this.helpSelections.seekHelp).filter(k => this.helpSelections.seekHelp[k]);
    
    const offerMentorArr = Object.keys(this.helpSelections.offerMentoring).filter(k => this.helpSelections.offerMentoring[k]);
    const seekMentorArr = Object.keys(this.helpSelections.seekMentoring).filter(k => this.helpSelections.seekMentoring[k]);

    const helpObj = this.helps[0] || { 
      id: undefined, 
      offerHelp: '', 
      seekHelp: '', 
      offerMentor: '', 
      seekMentor: '' 
    };

    helpObj.offerHelp = offerHelpArr.join(', ');
    helpObj.seekHelp = seekHelpArr.join(', ');
    helpObj.offerMentor = offerMentorArr.join(', ');
    helpObj.seekMentor = seekMentorArr.join(', ');

    if (helpObj.id) {
      this.profileService.updateHelp(helpObj.id, helpObj).subscribe(h => {
        this.helps[0] = h;
        this.isEditingHelp = false;
      });
    } else {
      this.profileService.addHelp(helpObj).subscribe(h => {
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
    this.profileService.getMyEspritProfile().subscribe(p => this.espritProfile = p);
    this.profileService.getMyExperiences().subscribe(exps => this.experiences = exps);
    this.profileService.getMyEducations().subscribe(edus => this.educations = edus);
    this.profileService.getMySkills().subscribe(skills => this.skills = skills);
    this.profileService.getMyHelps().subscribe(helps => this.helps = helps);
  }

  updateProfile(): void {
    this.userService.updateProfile(this.user).subscribe(u => {
      this.user = u;
      this.isEditingProfile = false;
      alert('Informations personnelles mises à jour !');
    });
  }

  updateEspritProfile(): void {
    this.profileService.updateEspritProfile(this.espritProfile).subscribe(p => {
      this.espritProfile = p;
      this.isEditingEsprit = false;
      alert('Profil Esprit mis à jour !');
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
        this.user.avatarUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
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
