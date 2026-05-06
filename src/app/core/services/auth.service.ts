import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthRequest, AuthResponse, UserSession } from '../models/auth.models';
import { EncryptionService } from './encryption.service';
import { UserRole } from '../models/user-role.enum';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8086/EspritConnect/auth';
  private readonly sessionKey = 'user_session';
  
  private http = inject(HttpClient);
  private router = inject(Router);
  private encryptionService = inject(EncryptionService);

  isLoggedIn = signal(false);
  currentUser = signal<UserSession | null>(null);

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    const session = this.encryptionService.getItem(this.sessionKey) as UserSession;
    if (session) {
      this.isLoggedIn.set(true);
      this.currentUser.set(session);
    }
  }

  login(request: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        const session: UserSession = {
          token: response.accessToken,
          role: response.role,
          userId: response.userId
        };
        this.saveSession(session);
        this.redirectBasedOnRole(response.role);
      })
    );
  }

  register(request: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => {
        const session: UserSession = {
          token: response.accessToken,
          role: response.role,
          userId: response.userId
        };
        this.saveSession(session);
        this.redirectBasedOnRole(response.role);
      })
    );
  }

  logout() {
    this.encryptionService.removeItem(this.sessionKey);
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/acceuil']);
  }

  private saveSession(session: UserSession) {
    this.encryptionService.setItem(this.sessionKey, session);
    this.isLoggedIn.set(true);
    this.currentUser.set(session);
  }

  private redirectBasedOnRole(role: UserRole) {
    switch (role) {
      case UserRole.ADMIN:
        this.router.navigate(['/admin']);
        break;
      case UserRole.STUDENT:
        this.router.navigate(['/etudiant']);
        break;
      case UserRole.ALUMNI:
        this.router.navigate(['/ancien']);
        break;
      case UserRole.TEACHER:
        this.router.navigate(['/enseignant']);
        break;
      case UserRole.ENTERPRISE:
        this.router.navigate(['/entreprise']);
        break;
      default:
        this.router.navigate(['/acceuil']);
    }
  }
}
