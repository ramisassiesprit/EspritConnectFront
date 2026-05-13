import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GroupService } from '../../../../core/services/group.service';
import { GroupCreateRequest, GroupPrivacy } from '../../../../core/models/group.model';

@Component({
  selector: 'app-group-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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

  groupForm = this.fb.group({
    groupName: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    website: [''],
    logoUrl: [''],
    bannerUrl: [''],
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

  private normalizeValue(value: string | null | undefined): string | undefined {
    return value?.trim() || undefined;
  }

  get stepOneValid() {
    return this.groupForm.get('groupName')?.valid && this.groupForm.get('description')?.valid;
  }

  get stepTwoValid() {
    return this.groupForm.get('privacy')?.valid && this.groupForm.get('tagging')?.valid;
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
      logoUrl: this.normalizeValue(formValue.logoUrl),
      bannerUrl: this.normalizeValue(formValue.bannerUrl),
      privacy: this.groupForm.get('privacy')?.value as GroupPrivacy,
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

    this.groupService.createGroup(payload).subscribe({
      next: () => this.router.navigate(['/etudiant/groups']),
      error: () => {
        this.error = 'Unable to create group. Please try again later.';
        this.creating = false;
      }
    });
  }
}
