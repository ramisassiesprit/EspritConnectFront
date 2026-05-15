import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user-role.enum';

declare var Tesseract: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    role: [null, [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    studentCode: [''], // Added field for extracted identifier
    agreeTerms: [false, [Validators.requiredTrue]]
  }, {
    validators: this.passwordMatchValidator
  });

  roles = [
    { label: 'Étudiant', value: UserRole.ETUDIANT },
    { label: 'Ancien', value: UserRole.ALUMNI },
    { label: 'Enseignant', value: UserRole.ENSEIGNANT },
    { label: 'Entreprise', value: UserRole.ENTREPRISE }
  ];

  selectedImage: string | ArrayBuffer | null = null;
  isScanning: boolean = false;
  scanProgress: number = 0;

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImage = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async onCardSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isScanning = true;
      this.scanProgress = 0;

      const reader = new FileReader();
      reader.onload = async () => {
        const imageUrl = reader.result as string;
        
        try {
          // Use direct recognize call which is more stable in v5
          const result = await Tesseract.recognize(
            imageUrl,
            'fra+eng',
            {
              logger: (m: any) => {
                if (m.status === 'recognizing text') {
                  this.scanProgress = Math.floor(m.progress * 100);
                }
              }
            }
          );

          console.log('Extracted Text:', result.data.text);
          this.parseExtractedText(result.data.text);

          // 2. Extract Avatar (Cropping)
          this.extractAvatarFromCard(imageUrl);

        } catch (error) {
          console.error('OCR Error:', error);
        } finally {
          this.isScanning = false;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  parseExtractedText(text: string) {
    // Normalization
    const lines = text.split('\n').map(l => l.trim());
    
    // Regex patterns based on the provided card
    const nomMatch = text.match(/NOM\s*:\s*([A-Z\s]+)/i);
    const prenomMatch = text.match(/PR[EÉ]NOM\s*:\s*([A-Z\s]+)/i);
    const identifiantMatch = text.match(/IDENTIFIANT\s*:\s*([A-Z0-9]+)/i);
    const niveauMatch = text.match(/NIVEAU\s*:\s*(.+)/i);

    if (nomMatch) this.registerForm.patchValue({ lastName: nomMatch[1].trim() });
    if (prenomMatch) this.registerForm.patchValue({ firstName: prenomMatch[1].trim() });
    if (identifiantMatch) this.registerForm.patchValue({ studentCode: identifiantMatch[1].trim() });
    
    // Auto-select student role if card is detected
    this.registerForm.patchValue({ role: UserRole.ETUDIANT });
  }

  extractAvatarFromCard(imageUrl: string) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Based on the card provided, the photo is roughly at the right side
      // X: 55% to 90%, Y: 40% to 85%
      const startX = img.width * 0.55;
      const startY = img.height * 0.40;
      const width = img.width * 0.35;
      const height = img.height * 0.45;

      canvas.width = 200;
      canvas.height = 200;

      ctx.drawImage(img, startX, startY, width, height, 0, 0, 200, 200);
      this.selectedImage = canvas.toDataURL('image/jpeg');
    };
    img.src = imageUrl;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const { confirmPassword, agreeTerms, ...registerData } = this.registerForm.value;
      
      const finalData = {
        ...registerData,
        avatarUrl: this.selectedImage
      };

      this.authService.register(finalData).subscribe({
        next: () => {
          console.log('Registration successful', finalData);
          this.router.navigate(['/acceuil']);
        },
        error: (err) => {
          console.error('Registration failed', err);
        }
      });
    }
  }
}
