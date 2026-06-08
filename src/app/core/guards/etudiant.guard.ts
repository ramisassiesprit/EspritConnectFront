import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user-role.enum';

export const etudiantGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const session = authService.currentUser();

  // Allow real students
  if (session && session.role === UserRole.ETUDIANT) {
    return true;
  }

  // Allow admins / enseignants / entreprises who clicked "Vue Étudiant"
  const allowedRoles = [UserRole.ADMIN, UserRole.ENSEIGNANT, UserRole.ENTREPRISE, UserRole.ALUMNI];
  const isViewSwitchMode = localStorage.getItem('viewMode') === 'etudiant';
  if (session && allowedRoles.includes(session.role as UserRole) && isViewSwitchMode) {
    return true;
  }

  return router.createUrlTree(['/acceuil']);
};