import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '../../../../core/services/group.service';
import { Group, GroupPrivacy } from '../../../../core/models/group.model';
import { QuillModule } from 'ngx-quill';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../core/models/user-role.enum';

@Component({
  selector: 'app-group-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, QuillModule],
  templateUrl: './group-update.component.html',
  styleUrls: ['./group-update.component.css']
})
export class GroupUpdateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private groupService = inject(GroupService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  updating = false;
  error = '';
  groupId: string | null = null;
  currentGroup: Group | null = null;

  // Dropdown options
  affiliationOptions = ['student', 'Alumni', 'company', 'teacher/staff'];
  espritPrograms = ['ESE - Esprit School of Engineering', 'ESB - Esprit School of Business', 'ESM - Esprim Monastir', 'Evening Classes', 'Dual Studies'];
  helpOptions = ['introduction to connections', 'answer industry specific questions', 'open doors at Workplace', 'meet for coffee'];
  mentoringOptions = ['Mentor a young professional', 'Mentor a student', 'Career advice', 'Resume review', 'Internship'];
  fieldOfStudyOptions = ['Computer Science', 'Engineering', 'Business', 'Finance', 'Marketing', 'Other'];
  degreeOptions = ['Bachelor', 'Master', 'PhD', 'Diploma'];
  graduationYearOptions = Array.from({ length: 20 }, (_, i) => String(new Date().getFullYear() - 10 + i));
  industryOptions = ['Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Other'];
  jobFunctionOptions = ['Engineering', 'Sales', 'Marketing', 'Operations', 'HR', 'Finance', 'Other'];

  // Selection states
  locations: string[] = [];
  newLocation = '';

  labels: string[] = [];
  newLabel = '';

  // Dropdown open/close states
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
      tagging: [false],
    company: ['']
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.groupId = id;
        this.loadGroupData(id);
      }
    });
  }

  private loadGroupData(id: string) {
    this.groupService.getGroupById(id).subscribe({
      next: (group) => {
        this.currentGroup = group;
        this.groupForm.patchValue({
          groupName: group.groupName,
          description: group.description,
          website: group.website || '',
          privacy: group.privacy || GroupPrivacy.PUBLIC,
          tagging: group.tagging || false,
          company: group.company || ''
        });

        if (group.logoUrl) {
          this.logoPreview = group.logoUrl.startsWith('http') 
            ? group.logoUrl 
            : `${this.getBaseUrl()}${group.logoUrl}`;
        }

        if (group.bannerUrl) {
          this.bannerPreview = group.bannerUrl.startsWith('http') 
            ? group.bannerUrl 
            : `${this.getBaseUrl()}${group.bannerUrl}`;
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

  private getBaseUrl(): string {
    return 'http://localhost:8086/EspritConnect/';
  }



  // --- Dropdown Logic ---
  toggleDropdown(field: string) {
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

  removeLocation(loc: string) {
    this.locations = this.locations.filter(l => l !== loc);
  }

  addLabelFromInput(input: HTMLInputElement) {
    const value = input.value;
    if (value && value.trim()) {
      const label = value.trim();
      if (!this.labels.includes(label)) {
        this.labels.push(label);
      }
      input.value = '';
    }
  }

  removeLabel(label: string) {
    this.labels = this.labels.filter(l => l !== label);
  }

  // --- File Upload ---
  onLogoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.logoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.logoFile);
    }
  }

  onBannerFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.bannerFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.bannerPreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.bannerFile);
    }
  }

  // --- Submit ---
  submitUpdate() {
    if (!this.groupForm.valid || !this.groupId) {
      return;
    }

    this.updating = true;
    const formValue = this.groupForm.getRawValue();
    
    const payload: any = {
      groupName: formValue.groupName || '',
      description: formValue.description || '',
      website: formValue.website || '',
      privacy: formValue.privacy || 'PUBLIC',
      tagging: formValue.tagging || false,
      company: formValue.company || '',
      location: this.locations.join(', '),
      labels: this.labels.join(', '),
      affiliation: this.selectedOptions['affiliation'].join(', '),
      fieldOfStudy: this.selectedOptions['fieldOfStudy'].join(', '),
      degree: this.selectedOptions['degree'].join(', '),
      graduationYear: this.selectedOptions['graduationYear'].join(', '),
      institutionProgram: this.selectedOptions['institutionProgram'].join(', '),
      otherDegree: this.selectedOptions['otherDegree'].join(', '),
      otherGraduationYear: this.selectedOptions['otherGraduationYear'].join(', '),
      industry: this.selectedOptions['industry'].join(', '),
      jobFunction: this.selectedOptions['jobFunction'].join(', '),
      willingOffering: this.selectedOptions['offeringHelp'].join(', '),
      willingSeeking: this.selectedOptions['seekingHelp'].join(', '),
      mentoringOffering: this.selectedOptions['mentoringOffering'].join(', '),
      mentoringSeeking: this.selectedOptions['mentoringSeeking'].join(', ')
    };

    this.groupService.updateGroup(this.groupId, payload, this.logoFile || undefined, this.bannerFile || undefined).subscribe({
      next: (updatedGroup) => {
        this.updating = false;
        const session = this.authService.currentUser();
        if (session && session.role === UserRole.ADMIN) {
          this.router.navigate(['/admin/groups', this.groupId]);
        } else {
          this.router.navigate(['/etudiant/groups', this.groupId, 'feed']);
        }
      },
      error: (err) => {
        this.updating = false;
        this.error = 'Failed to update group. Please try again.';
        console.error('Update error:', err);
      }
    });
  }

  cancel() {
    const session = this.authService.currentUser();
    if (session && session.role === UserRole.ADMIN) {
      if (this.groupId) {
        this.router.navigate(['/admin/groups', this.groupId]);
      } else {
        this.router.navigate(['/admin/groups']);
      }
    } else {
      if (this.groupId) {
        this.router.navigate(['/etudiant/groups', this.groupId, 'feed']);
      } else {
        this.router.navigate(['/etudiant/groups']);
      }
    }
  }
}
