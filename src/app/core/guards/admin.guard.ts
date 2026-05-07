import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user-role.enum';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const session = authService.currentUser();
  
  if (session && session.role === UserRole.ADMIN) {
    return true;
  }
  
  return router.createUrlTree(['/acceuil']);
};