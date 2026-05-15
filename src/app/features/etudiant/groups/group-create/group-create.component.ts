import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '../../../../core/services/group.service';
import { UserService } from '../../../../core/services/User.service';
import { GroupCreateRequest, GroupPrivacy } from '../../../../core/models/group.model';
import { User } from '../../../../core/models/user.model';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-group-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, QuillModule],
  templateUrl: './group-create.component.html',
  styleUrls: ['./group-create.component.css']
})
export class GroupCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private groupService = inject(GroupService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  activeStep = 1;
  creating = false;
  error = '';
  isEditMode = false;
  editGroupId: string | null = null;

  // Dropdown options
  affiliationOptions = ['student', 'Alumni', 'company', 'teacher/staff'];
  espritPrograms = ['ESE - Esprit School of Engineering', 'ESB - Esprit School of Business', 'ESM - Esprim Monastir', 'Evening Classes', 'Dual Studies'];
  helpOptions = ['introduction to connections', 'answer industry specific questions', 'open doors at Workplace', 'meet for coffee'];
  mentoringOptions = ['Mentor a young professional', 'Mentor a student', 'Career advice', 'Resume review', 'Internship'];
  
  // Selection states
  locations: string[] = [];
  newLocation = '';
  
  labels: string[] = [];
  newLabel = '';

  // Dropdown open/close states (closed initially)
  dropdownStates: { [key: string]: boolean } = {
    affiliation: false,
    fieldOfStudy: false,
    degree: false,
    graduationYear: false,
    institutionProgram: false,
    otherDegree: false,
    otherGraduationYear: false,
    industry: false,
    jobFunction: false,
    offeringHelp: false,
    seekingHelp: false,
    mentoringOffering: false,
    mentoringSeeking: false
  };

  // Multi-select search states
  searchTerms: { [key: string]: string } = {
    affiliation: '',
    fieldOfStudy: '',
    degree: '',
    graduationYear: '',
    institutionProgram: '',
    otherDegree: '',
    otherGraduationYear: '',
    industry: '',
    jobFunction: '',
    offeringHelp: '',
    seekingHelp: '',
    mentoringOffering: '',
    mentoringSeeking: ''
  };
  selectedOptions: { [key: string]: string[] } = {
    affiliation: [],
    fieldOfStudy: [],
    degree: [],
    graduationYear: [],
    institutionProgram: [],
    otherDegree: [],
    otherGraduationYear: [],
    industry: [],
    jobFunction: [],
    offeringHelp: [],
    seekingHelp: [],
    mentoringOffering: [],
    mentoringSeeking: []
  };

  // User search
  userSearchTerm = '';
  foundUsers: User[] = [];
  addedMembers: User[] = [];
  isSearchingUsers = false;

  quillModules = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        ['undo', 'redo'],
        [{ 'align': '' }, { 'align': 'center' }, { 'align': 'right' }, { 'align': 'justify' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'list': 'bullet' }, { 'list': 'ordered' }],
        ['link']
      ]
    }
  };

  logoFile: File | null = null;
  bannerFile: File | null = null;
  logoPreview: string | null = null;
  bannerPreview: string | null = null;

  groupForm = this.fb.group({
    groupName: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(4000)]],
    website: [''],
    privacy: ['PUBLIC', Validators.required],
    tagging: [false, Validators.required],
    company: ['']
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.editGroupId = id;
        this.loadGroupData(id);
      }
    });
  }

  private loadGroupData(id: string) {
    this.groupService.getGroupById(id).subscribe({
      next: (group) => {
        this.groupForm.patchValue({
          groupName: group.groupName,
          description: group.description,
          website: group.website || '',
          privacy: group.privacy || GroupPrivacy.PUBLIC,
          tagging: group.tagging || false,
          company: group.company || ''
        });

        if (group.logoUrl) {
          this.logoPreview = group.logoUrl.startsWith('http') ? group.logoUrl : `http://localhost:8086/EspritConnect/${group.logoUrl}`;
        }
        if (group.bannerUrl) {
          this.bannerPreview = group.bannerUrl.startsWith('http') ? group.bannerUrl : `http://localhost:8086/EspritConnect/${group.bannerUrl}`;
        }

        this.labels = group.labels ? group.labels.split(',').map(l => l.trim()).filter(Boolean) : [];
        this.locations = group.location ? group.location.split(',').map(l => l.trim()).filter(Boolean) : [];

        const setOptions = (field: string, values: string | undefined) => {
          if (values) {
            this.selectedOptions[field] = values.split(',').map(v => v.trim()).filter(Boolean);
          }
        };

        setOptions('affiliation', group.affiliation);
        setOptions('fieldOfStudy', group.fieldOfStudy);
        setOptions('degree', group.degree);
        setOptions('graduationYear', group.graduationYear);
        setOptions('institutionProgram', group.institutionProgram);
        setOptions('otherDegree', group.otherDegree);
        setOptions('otherGraduationYear', group.otherGraduationYear);
        setOptions('industry', group.industry);
        setOptions('jobFunction', group.jobFunction);
        setOptions('offeringHelp', group.willingOffering);
        setOptions('seekingHelp', group.willingSeeking);
        setOptions('mentoringOffering', group.mentoringOffering);
        setOptions('mentoringSeeking', group.mentoringSeeking);
      },
      error: (err) => {
        console.error('Failed to load group details', err);
        this.error = 'Failed to load group details for editing.';
      }
    });
  }

  // --- Step Management ---
  get stepOneValid() {
    return (this.groupForm.get('groupName')?.valid ?? false) && (this.groupForm.get('description')?.valid ?? false);
  }

  get stepTwoValid() {
    return (this.groupForm.get('privacy')?.valid ?? false);
  }

  goToStep(step: number) {
    if (step === 2 && !this.stepOneValid) {
      this.groupForm.get('groupName')?.markAsTouched();
      this.groupForm.get('description')?.markAsTouched();
      return;
    }
    if (step === 3 && !this.stepTwoValid) {
      return;
    }
    this.activeStep = step;
  }

  advanceStep() {
    if (this.activeStep === 1) {
      this.goToStep(2);
    } else if (this.activeStep === 2) {
      this.addLabel();
      this.goToStep(3);
    }
  }

  // --- Dropdown Logic ---
  toggleDropdown(field: string) {
    // Close others first for better UX?
    Object.keys(this.dropdownStates).forEach(key => {
      if (key !== field) this.dropdownStates[key] = false;
    });
    this.dropdownStates[field] = !this.dropdownStates[field];
  }

  toggleOption(field: string, option: string) {
    const index = this.selectedOptions[field].indexOf(option);
    if (index === -1) {
      this.selectedOptions[field].push(option);
    } else {
      this.selectedOptions[field].splice(index, 1);
    }
  }

  isSelected(field: string, option: string): boolean {
    return this.selectedOptions[field].includes(option);
  }

  getFilteredOptions(field: string, allOptions: string[]): string[] {
    const term = (this.searchTerms[field] || '').toLowerCase();
    return allOptions.filter(opt => opt.toLowerCase().includes(term));
  }

  // --- Locations & Labels ---
  addLocationFromInput(input: HTMLInputElement) {
    const value = input.value;
    if (value && value.trim()) {
      const loc = value.trim();
      if (!this.locations.includes(loc)) {
        this.locations.push(loc);
      }
      input.value = '';
    }
  }

  addLocation() {}

  removeLocation(loc: string) {
    this.locations = this.locations.filter(l => l !== loc);
  }

  addLabelFromInput(input: HTMLInputElement) {
    const value = input.value;
    console.log('addLabelFromInput called with:', value);
    if (value && value.trim()) {
      const label = value.trim();
      if (!this.labels.includes(label)) {
        this.labels.push(label);
        console.log('Label added. Current labels:', this.labels);
      }
      input.value = '';
    }
  }

  addLabel() {
    console.log('addLabel called with:', this.newLabel);
    if (this.newLabel && this.newLabel.trim()) {
      const label = this.newLabel.trim();
      if (!this.labels.includes(label)) {
        this.labels.push(label);
        console.log('Label added. Current labels:', this.labels);
      }
      this.newLabel = '';
    }
  }

  removeLabel(label: string) {
    this.labels = this.labels.filter(l => l !== label);
  }

  // --- User Search ---
  searchUsers() {
    if (this.userSearchTerm.length < 2) {
      this.foundUsers = [];
      return;
    }

    this.isSearchingUsers = true;
    this.userService.getDirectoryUsers().subscribe({
      next: (users) => {
        const term = this.userSearchTerm.toLowerCase();
        this.foundUsers = users.filter(u => 
          u.firstName.toLowerCase().includes(term) || 
          u.lastName.toLowerCase().includes(term)
        ).slice(0, 5);
        this.isSearchingUsers = false;
      },
      error: () => {
        this.isSearchingUsers = false;
      }
    });
  }

  addMember(user: User) {
    if (!this.addedMembers.find(m => m.id === user.id)) {
      this.addedMembers.push(user);
    }
    this.userSearchTerm = '';
    this.foundUsers = [];
  }

  removeMember(userId: string) {
    this.addedMembers = this.addedMembers.filter(m => m.id !== userId);
  }

  // --- File Upload ---
  onLogoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.logoFile = input.files[0];
      this.createPreview(this.logoFile, 'logo');
    }
  }

  onBannerFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.bannerFile = input.files[0];
      this.createPreview(this.bannerFile, 'banner');
    }
  }

  private createPreview(file: File, type: 'logo' | 'banner') {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'logo') this.logoPreview = e.target?.result as string;
      else this.bannerPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeLogo() { this.logoFile = null; this.logoPreview = null; }
  removeBanner() { this.bannerFile = null; this.bannerPreview = null; }

  onCancel() {
    this.router.navigate(['/etudiant/groups']);
  }

  submit() {
    if (this.activeStep !== 3) {
      this.advanceStep();
      return;
    }
    
    this.addLocation();

    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }

    const formValue = this.groupForm.value;
    const payload: GroupCreateRequest = {
      groupName: formValue.groupName!,
      description: formValue.description!,
      website: formValue.website || undefined,
      privacy: formValue.privacy as GroupPrivacy,
      tagging: formValue.tagging ?? false,
      labels: this.labels.join(','),
      location: this.locations.join(','),
      affiliation: this.selectedOptions['affiliation'].join(','),
      fieldOfStudy: this.selectedOptions['fieldOfStudy'].join(','),
      degree: this.selectedOptions['degree'].join(','),
      graduationYear: this.selectedOptions['graduationYear'].join(','),
      institutionProgram: this.selectedOptions['institutionProgram'].join(','),
      otherDegree: this.selectedOptions['otherDegree'].join(','),
      otherGraduationYear: this.selectedOptions['otherGraduationYear'].join(','),
      company: formValue.company || undefined,
      industry: this.selectedOptions['industry'].join(','),
      jobFunction: this.selectedOptions['jobFunction'].join(','),
      willingOffering: this.selectedOptions['offeringHelp'].join(','),
      willingSeeking: this.selectedOptions['seekingHelp'].join(','),
      mentoringOffering: this.selectedOptions['mentoringOffering'].join(','),
      mentoringSeeking: this.selectedOptions['mentoringSeeking'].join(','),
      addMembers: this.addedMembers.map(m => m.id).join(',')
    };
    console.log('Sending group labels:', payload.labels);
    this.creating = true;
    this.error = '';

    if (this.isEditMode && this.editGroupId) {
      this.groupService.updateGroup(this.editGroupId, payload, this.logoFile || undefined, this.bannerFile || undefined).subscribe({
        next: () => {
          alert('Group updated successfully!');
          this.router.navigate(['/etudiant/groups']);
        },
        error: (err) => {
          console.error('Group update failed:', err);
          this.error = 'Unable to update group. Please check your inputs and try again.';
          this.creating = false;
        }
      });
    } else {
      this.groupService.createGroupWithFiles(payload, this.logoFile || undefined, this.bannerFile || undefined).subscribe({
        next: () => {
          alert('Group created successfully! Your group is pending admin approval.');
          this.router.navigate(['/etudiant/groups']);
        },
        error: (err) => {
          console.error('Group creation failed:', err);
          this.error = 'Unable to create group. Please check your inputs and try again.';
          this.creating = false;
        }
      });
    }
  }

  deleteGroup() {
    if (!this.editGroupId) return;
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
    
    this.groupService.deleteGroup(this.editGroupId).subscribe({
      next: () => {
        alert('Group deleted successfully.');
        this.router.navigate(['/etudiant/groups']);
      },
      error: (err) => {
        console.error('Failed to delete group', err);
        this.error = 'Failed to delete group. Please try again.';
      }
    });
  }
}
