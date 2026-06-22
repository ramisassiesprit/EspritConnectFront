import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { User, EspritProfile, WorkExperience, OtherEducation, Skill } from '../../../core/models/user.model';
import { Event } from '../../../core/models/event.model';

@Component({
  selector: 'app-cv-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-template.component.html',
  styleUrl: './cv-template.component.css'
})
export class CvTemplateComponent {
  @Input() user?: User;
  @Input() espritProfile?: EspritProfile;
  @Input() experiences: WorkExperience[] = [];
  @Input() educations: OtherEducation[] = [];
  @Input() skills: Skill[] = [];
  @Input() events: Event[] = [];

  @Input() templateType: 'esprit' | 'ats' | 'dark' = 'esprit';
  @Input() primaryColor: string = '#ED1C24'; // Default Esprit Red

  @ViewChild('cvContent') cvContent!: ElementRef;

  public isGenerating = false;

  // Generate QR Code URL via free API
  get qrCodeUrl(): string {
    if (!this.user || !this.user.id) return '';
    const profileUrl = `http://localhost:4200/etudiant/users/${this.user.id}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(profileUrl)}&margin=10`;
  }

  public async generatePDF() {
    if (!this.cvContent) return;

    this.isGenerating = true;
    try {
      const element = this.cvContent.nativeElement;

      // Temporarily make it visible for capture if we want to hide it normally
      const originalDisplay = element.style.display;
      element.style.display = 'block';

      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true, // Allow external images (like profile picture)
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const fileName = `CV_${this.user?.firstName || 'User'}_${this.user?.lastName || 'Profile'}.pdf`;
      pdf.save(fileName);

      element.style.display = originalDisplay;
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      this.isGenerating = false;
    }
  }

  formatDate(date?: string): string {
    if (!date) return 'Présent';
    return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
  }

  // To check if a specific section should be displayed
  hasExperiences(): boolean {
    return this.experiences && this.experiences.length > 0;
  }

  hasEducations(): boolean {
    return this.educations && this.educations.length > 0;
  }

  hasSkills(): boolean {
    return this.skills && this.skills.length > 0;
  }

  hasEvents(): boolean {
    return this.events && this.events.length > 0;
  }
}
