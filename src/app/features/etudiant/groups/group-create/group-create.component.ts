import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GroupService } from '../../../../core/services/group.service';
import { GroupCreateRequest, GroupPrivacy } from '../../../../core/models/group.model';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-group-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './group-create.component.html',
  styleUrls: ['./group-create.component.css']
})
export class GroupCreateComponent {
  private fb = inject(FormBuilder);
  private groupService = inject(GroupService);
  private router = inject(Router);

  activeStep = 1;
  creating = false;
  error = '';

  quillModules = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        ['undo', 'redo'],
        [{ 'align': '' }, { 'align': 'center' }, { 'align': 'right' }, { 'align': 'justify' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'list': 'bullet' }, { 'list': 'ordered' }],
        ['link'],
        ['emoji']
      ],
      handlers: {
        'undo': function() {
          (this as any).quill.history.undo();
        },
        'redo': function() {
          (this as any).quill.history.redo();
        },
        'emoji': function() {
          console.log('Emoji picker clicked');
          // For now, we can just insert a default emoji or open a picker if we had one
        }
      }
    },
    history: {
      delay: 2000,
      maxStack: 500,
      userOnly: true
    }
  };

  // File upload properties
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
    labels: [''],
    location: [''],
    affiliation: [''],
    fieldOfStudy: [''],
    degree: [''],
    graduationYear: [''],
    institutionProgram: [''],
    otherDegree: [''],
    otherGraduationYear: [''],
    company: [''],
    industry: [''],
    jobFunction: [''],
    willingOffering: [''],
    willingSeeking: [''],
    mentoringOffering: [''],
    mentoringSeeking: [''],
    addMembers: ['']
  });

  private normalizeValue(value: any): string | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    return String(value).trim() || undefined;
  }

  get stepOneValid() {
    return (this.groupForm.get('groupName')?.valid ?? false) && (this.groupForm.get('description')?.valid ?? false);
  }

  get stepTwoValid() {
    return (this.groupForm.get('privacy')?.valid ?? false) && (this.groupForm.get('tagging')?.valid ?? false);
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
      this.goToStep(3);
    }
  }

  onCancel() {
    this.router.navigate(['/etudiant/groups']);
  }

  // File upload methods
  onLogoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.logoFile = file;
      this.createPreview(file, 'logo');
    }
  }

  onBannerFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.bannerFile = file;
      this.createPreview(file, 'banner');
    }
  }

  private createPreview(file: File, type: 'logo' | 'banner') {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'logo') {
        this.logoPreview = e.target?.result as string;
      } else {
        this.bannerPreview = e.target?.result as string;
      }
    };
    reader.readAsDataURL(file);
  }

  removeLogo() {
    this.logoFile = null;
    this.logoPreview = null;
  }

  removeBanner() {
    this.bannerFile = null;
    this.bannerPreview = null;
  }

  submit() {
    if (this.activeStep !== 3) {
      this.advanceStep();
      return;
    }

    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }

    const formValue = this.groupForm.value;
    const payload: GroupCreateRequest = {
      groupName: formValue.groupName!,
      description: formValue.description!,
      website: this.normalizeValue(formValue.website),
      privacy: formValue.privacy as GroupPrivacy,
      tagging: formValue.tagging ?? false,
      labels: this.normalizeValue(formValue.labels),
      location: this.normalizeValue(formValue.location),
      affiliation: this.normalizeValue(formValue.affiliation),
      fieldOfStudy: this.normalizeValue(formValue.fieldOfStudy),
      degree: this.normalizeValue(formValue.degree),
      graduationYear: formValue.graduationYear ? Number(formValue.graduationYear) : undefined,
      institutionProgram: this.normalizeValue(formValue.institutionProgram),
      otherDegree: this.normalizeValue(formValue.otherDegree),
      otherGraduationYear: formValue.otherGraduationYear ? Number(formValue.otherGraduationYear) : undefined,
      company: this.normalizeValue(formValue.company),
      industry: this.normalizeValue(formValue.industry),
      jobFunction: this.normalizeValue(formValue.jobFunction),
      willingOffering: this.normalizeValue(formValue.willingOffering),
      willingSeeking: this.normalizeValue(formValue.willingSeeking),
      mentoringOffering: this.normalizeValue(formValue.mentoringOffering),
      mentoringSeeking: this.normalizeValue(formValue.mentoringSeeking),
      addMembers: this.normalizeValue(formValue.addMembers)
    };

    this.creating = true;
    this.error = '';

    // Always use createGroupWithFiles if files exist, otherwise fallback
    this.groupService.createGroupWithFiles(payload, this.logoFile || undefined, this.bannerFile || undefined).subscribe({
      next: () => this.router.navigate(['/etudiant/groups']),
      error: (err) => {
        console.error('Group creation failed:', err);
        this.error = 'Unable to create group. Please check your inputs and try again.';
        this.creating = false;
      }
    });
  }
}
