import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/User.service';
import { UserSession } from '../../core/models/auth.models';
import { UserRole } from '../../core/models/user-role.enum';

@Component({
  selector: 'app-oauth2-redirect',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './oauth2-redirect.component.html',
  styleUrl: './oauth2-redirect.component.css'
})
export class Oauth2RedirectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  showCompletionForm = false;
  completionForm!: FormGroup;
  sessionData!: UserSession;

  roles = [
    { label: 'Étudiant', value: UserRole.ETUDIANT },
    { label: 'Ancien', value: UserRole.ALUMNI },
    { label: 'Enseignant', value: UserRole.ENSEIGNANT },
    { label: 'Entreprise', value: UserRole.ENTREPRISE }
  ];

  UserRole = UserRole;

  ngOnInit(): void {
    this.initForm();

    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const refreshToken = params['refreshToken'];
      const userId = params['userId'];
      const roleStr = params['role'];
      const firstNameEncoded = params['firstName'];
      const lastNameEncoded = params['lastName'];
      const email = params['email'];
      const avatarUrlEncoded = params['avatarUrl'];
      const isNew = params['isNew'] === 'true';

      if (token && userId && roleStr) {
        try {
          const firstName = firstNameEncoded ? decodeURIComponent(firstNameEncoded) : '';
          const lastName = lastNameEncoded ? decodeURIComponent(lastNameEncoded) : '';
          const avatarUrl = avatarUrlEncoded ? decodeURIComponent(avatarUrlEncoded) : '';

          const role = roleStr as UserRole;

          this.sessionData = {
            token: token,
            refreshToken: refreshToken || '',
            userId: userId,
            role: role,
            firstName: firstName,
            lastName: lastName,
            email: email || '',
            avatarUrl: avatarUrl
          };

          // Sauvegarder temporairement la session pour authentifier les appels de profil
          this.authService.saveSession(this.sessionData);

          if (isNew) {
            this.showCompletionForm = true;
          } else {
            // Utilisateur déjà existant, redirection directe
            const homePath = this.authService.getHomePath();
            this.router.navigate([homePath]);
          }
        } catch (error) {
          console.error('Erreur lors du traitement de la redirection OAuth2', error);
          this.router.navigate(['/acceuil']);
        }
      } else {
        console.error('Paramètres OAuth2 manquants dans la redirection URL');
        this.router.navigate(['/acceuil']);
      }
    });
  }

  private initForm(): void {
    this.completionForm = this.fb.group({
      role: [UserRole.ETUDIANT, [Validators.required]],
      numTel: ['', [Validators.required, Validators.pattern('^[0-9]{8,15}$')]],
      code: ['', [Validators.required]],
      companyName: [''],
      jobTitle: [''],
      industry: [''],
      jobFunction: ['']
    });

    // Écouter les changements de rôle pour ajuster dynamiquement les validations
    this.completionForm.get('role')?.valueChanges.subscribe(role => {
      const codeControl = this.completionForm.get('code');
      const companyControl = this.completionForm.get('companyName');

      if (role === UserRole.ENTREPRISE) {
        codeControl?.clearValidators();
        companyControl?.setValidators([Validators.required]);
      } else {
        codeControl?.setValidators([Validators.required]);
        companyControl?.clearValidators();
      }

      codeControl?.updateValueAndValidity();
      companyControl?.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    if (this.completionForm.invalid) {
      this.completionForm.markAllAsTouched();
      return;
    }

    const formValues = this.completionForm.value;

    this.userService.getCurrentUser().subscribe({
      next: (currentUser) => {
        // Préparer les données mises à jour
        const updatedUser: any = {
          ...currentUser,
          role: formValues.role,
          numTel: parseInt(formValues.numTel, 10),
          code: formValues.role !== UserRole.ENTREPRISE ? formValues.code : null,
          companyName: formValues.role === UserRole.ENTREPRISE ? formValues.companyName : null,
          jobTitle: formValues.role === UserRole.ENTREPRISE ? formValues.jobTitle : null,
          industry: formValues.role === UserRole.ENTREPRISE ? formValues.industry : null,
          jobFunction: formValues.role === UserRole.ENTREPRISE ? formValues.jobFunction : null
        };

        // Mettre à jour le profil utilisateur via le backend
        this.userService.updateProfile(updatedUser).subscribe({
          next: (savedUser) => {
            // Sauvegarder la session finale avec le bon rôle
            const finalSession: UserSession = {
              ...this.sessionData,
              role: savedUser.role as UserRole,
              firstName: savedUser.firstName,
              lastName: savedUser.lastName,
              avatarUrl: savedUser.avatarUrl || this.sessionData.avatarUrl
            };

            this.authService.saveSession(finalSession);

            // Rediriger l'utilisateur vers son espace approprié
            const homePath = this.authService.getHomePath();
            this.router.navigate([homePath]);
          },
          error: (err) => {
            console.error('Erreur lors de la mise à jour du profil', err);
            alert("Une erreur est survenue lors de la finalisation de votre profil. Veuillez réessayer.");
          }
        });
      },
      error: (err) => {
        console.error("Impossible de récupérer les détails de l'utilisateur", err);
        alert("Erreur de session. Veuillez vous reconnecter.");
        this.authService.logout();
      }
    });
  }
}
