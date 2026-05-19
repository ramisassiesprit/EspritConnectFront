import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="reset-container">
      <div class="reset-card fade-in">
        <div class="reset-header">
          <img src="LogoEsprit.png" alt="ESPRIT" class="reset-logo" />
          <h2>Réinitialisation du mot de passe</h2>
          <p>Choisissez un nouveau mot de passe fort pour votre compte Esprit Connect.</p>
        </div>

        @if (resetSuccess()) {
          <div class="success-panel text-center">
            <div class="success-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3>Mot de passe modifié !</h3>
            <p>Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.</p>
            <button class="btn-primary" (click)="redirectToLogin()">Se connecter</button>
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()" #resetForm="ngForm" class="reset-form">
            <div class="form-group">
              <label for="newPassword">Nouveau mot de passe*</label>
              <div class="password-input-wrapper">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  id="newPassword"
                  name="newPassword"
                  [(ngModel)]="newPassword"
                  required
                  minlength="8"
                  #passwordInput="ngModel"
                  placeholder="Minimum 8 caractères"
                  class="form-control"
                />
                <button type="button" class="btn-toggle-eye" (click)="togglePasswordVisibility()">
                  @if (showPassword()) {
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  }
                </button>
              </div>
              @if (passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)) {
                <div class="field-error">Le mot de passe doit contenir au moins 8 caractères.</div>
              }
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirmer le mot de passe*</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                [(ngModel)]="confirmPassword"
                required
                placeholder="Ressaisir le mot de passe"
                class="form-control"
              />
              @if (newPassword !== confirmPassword && confirmPassword) {
                <div class="field-error">Les mots de passe ne correspondent pas.</div>
              }
            </div>

            @if (errorMessage()) {
              <div class="alert-danger">{{ errorMessage() }}</div>
            }

            <button
              type="submit"
              class="btn-primary"
              [disabled]="resetForm.invalid || newPassword !== confirmPassword || isLoading()"
            >
              {{ isLoading() ? 'Modification...' : 'Modifier le mot de passe' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .reset-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: radial-gradient(circle at top right, #fdf8f8 0%, #f5ecec 100%);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      padding: 20px;
    }

    .reset-card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      border: 1px solid #eaeaea;
      padding: 40px;
      width: 100%;
      max-width: 480px;
      transition: all 0.3s ease;
    }

    .reset-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .reset-logo {
      height: 45px;
      object-fit: contain;
      margin-bottom: 20px;
    }

    .reset-header h2 {
      color: #111111;
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 8px 0;
    }

    .reset-header p {
      color: #666666;
      font-size: 14px;
      margin: 0;
      line-height: 1.5;
    }

    .reset-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 13px;
      font-weight: 600;
      color: #333333;
    }

    .form-control {
      padding: 12px 16px;
      border: 1px solid #cccccc;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      width: 100%;
      box-sizing: border-box;
    }

    .form-control:focus {
      border-color: #C00000;
      box-shadow: 0 0 0 3px rgba(192, 0, 0, 0.1);
    }

    .password-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .btn-toggle-eye {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #666666;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .btn-toggle-eye:hover {
      color: #111111;
    }

    .btn-primary {
      background-color: #C00000;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 14px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s ease, transform 0.1s ease;
      width: 100%;
      margin-top: 10px;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #a00000;
    }

    .btn-primary:active:not(:disabled) {
      transform: scale(0.98);
    }

    .btn-primary:disabled {
      background-color: #e0e0e0;
      color: #888888;
      cursor: not-allowed;
    }

    .field-error {
      color: #d32f2f;
      font-size: 12px;
      font-weight: 500;
    }

    .alert-danger {
      background-color: #ffebee;
      border: 1px solid #ffcdd2;
      color: #c62828;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      text-align: center;
    }

    .success-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
      padding: 20px 0;
    }

    .success-icon-wrapper {
      background-color: #e8f5e9;
      border-radius: 50%;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(46, 125, 50, 0.1);
    }

    .success-panel h3 {
      font-size: 20px;
      font-weight: 700;
      color: #2e7d32;
      margin: 0;
    }

    .success-panel p {
      color: #555555;
      font-size: 14px;
      line-height: 1.6;
      text-align: center;
      margin: 0;
    }

    .text-center {
      text-align: center;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .fade-in {
      animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  token: string = '';
  newPassword = '';
  confirmPassword = '';
  
  showPassword = signal(false);
  isLoading = signal(false);
  resetSuccess = signal(false);
  errorMessage = signal('');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.errorMessage.set('Token de réinitialisation manquant.');
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage.set('Les mots de passe ne correspondent pas.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.resetPassword({
      token: this.token,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.resetSuccess.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Token invalide ou expiré.');
      }
    });
  }

  redirectToLogin() {
    // Redirige vers l'accueil avec un paramètre pour forcer l'ouverture du modal de connexion !
    this.router.navigate(['/acceuil'], { queryParams: { login: 'true' } });
  }
}
