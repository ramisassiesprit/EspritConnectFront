import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take, Observable } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const session = authService.currentUser();

  let authReq = req;
  if (session && session.token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${session.token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !req.url.includes('/auth/login')) {
        // If we don't have a session, don't try to refresh the token
        if (!session?.token) {
          authService.logout();
          return throwError(() => error);
        }
        return handle401Error(req, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(req: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response) => {
        isRefreshing = false;
        refreshTokenSubject.next(response.accessToken);
        
        return next(req.clone({
          setHeaders: {
            Authorization: `Bearer ${response.accessToken}`
          }
        }));
      }),
      catchError((err) => {
        isRefreshing = false;
        refreshTokenSubject.error(err); // Ensure pending requests don't hang if refresh fails
        authService.logout();
        return throwError(() => err);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => {
        return next(req.clone({
          setHeaders: {
            Authorization: `Bearer ${token!}`
          }
        }));
      })
    );
  }
}
