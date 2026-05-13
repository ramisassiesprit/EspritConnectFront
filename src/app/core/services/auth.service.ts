import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthRequest, AuthResponse, RegisterRequest, UserSession } from '../models/auth.models';
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
          refreshToken: response.refreshToken,
          role: response.role,
          userId: response.userId,
          firstName: response.firstName,
          lastName: response.lastName,
          email: response.email,
          avatarUrl: response.avatarUrl
        };
        this.saveSession(session);
        this.redirectBasedOnRole(response.role);
      })
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => {
        if (response && response.accessToken) {
          const session: UserSession = {
            token: response.accessToken,
            refreshToken: response.refreshToken,
            role: response.role,
            userId: response.userId,
            firstName: response.firstName,
            lastName: response.lastName,
            email: response.email,
            avatarUrl: response.avatarUrl
          };
          this.saveSession(session);
          this.redirectBasedOnRole(response.role);
        } else {
          this.router.navigate(['/acceuil']); // Route to acceuil to log in
        }
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    // Note: on n'utilise pas l'intercepteur pour cette requête car le token actuel est expiré
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, {}, { withCredentials: true }).pipe(
      tap(response => {
        const session: UserSession = {
          token: response.accessToken,
          refreshToken: response.refreshToken,
          role: response.role,
          userId: response.userId,
          firstName: response.firstName,
          lastName: response.lastName,
          email: response.email,
          avatarUrl: response.avatarUrl
        };
        this.saveSession(session);
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
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

  getHomePath(): string {
    const session = this.currentUser();
    if (!session) return '/acceuil';
    
    switch (session.role) {
      case UserRole.ADMIN: return '/admin';
      case UserRole.ETUDIANT: return '/etudiant';
      case UserRole.ALUMNI: return '/ancien';
      case UserRole.ENSEIGNANT: return '/enseignant';
      case UserRole.ENTREPRISE: return '/entreprise';
      default: return '/acceuil';
    }
  }

  private redirectBasedOnRole(role: UserRole) {
    this.router.navigate([this.getHomePath()]);
  }
}
