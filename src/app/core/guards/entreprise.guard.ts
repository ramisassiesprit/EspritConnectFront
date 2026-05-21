import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/user-role.enum';
import { AuthService } from '../services/auth.service';

export const entrepriseGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const session = authService.currentUser();

  if (session && session.role === UserRole.ENTREPRISE) {
    return true;
  }

  return router.createUrlTree(['/acceuil']);
};

