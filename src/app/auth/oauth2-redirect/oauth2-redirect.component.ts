import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserSession } from '../../core/models/auth.models';
import { UserRole } from '../../core/models/user-role.enum';

@Component({
  selector: 'app-oauth2-redirect',
  standalone: true,
  imports: [],
  template: `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background-color: #f8f9fa;">
      <div style="text-align: center; padding: 30px; border-radius: 12px; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 400px; width: 90%;">
        <div style="border: 4px solid #f3f3f3; border-top: 4px solid #dc3545; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <h2 style="margin-bottom: 10px; color: #333; font-size: 20px;">Connexion en cours...</h2>
        <p style="color: #666; font-size: 14px; margin: 0;">Veuillez patienter pendant que nous sécurisons votre connexion.</p>
      </div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `
})
export class Oauth2RedirectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const refreshToken = params['refreshToken'];
      const userId = params['userId'];
      const roleStr = params['role'];
      const firstNameEncoded = params['firstName'];
      const lastNameEncoded = params['lastName'];
      const email = params['email'];
      const avatarUrlEncoded = params['avatarUrl'];

      if (token && userId && roleStr) {
        try {
          const firstName = firstNameEncoded ? decodeURIComponent(firstNameEncoded) : '';
          const lastName = lastNameEncoded ? decodeURIComponent(lastNameEncoded) : '';
          const avatarUrl = avatarUrlEncoded ? decodeURIComponent(avatarUrlEncoded) : '';

          const role = roleStr as UserRole;

          const session: UserSession = {
            token: token,
            refreshToken: refreshToken || '',
            userId: userId,
            role: role,
            firstName: firstName,
            lastName: lastName,
            email: email || '',
            avatarUrl: avatarUrl
          };

          // Sauvegarder la session dans le stockage chiffré
          this.authService.saveSession(session);

          // Rediriger vers l'espace approprié en fonction du rôle
          const homePath = this.authService.getHomePath();
          this.router.navigate([homePath]);
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
}
