import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take, Observable } from 'rxjs';

let isRefreshing = false;
// Use 'let' so we can recreate it after a failed refresh (avoids permanently errored subject)
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

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
        if (!session?.token) {
          authService.logout();
          return throwError(() => error);
        }
        return handle401Error(req, next, authService);
      }
      // For all other errors (403, 404, 500...) — just propagate, never logout
      return throwError(() => error);
    })
  );
};

function handle401Error(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    // Recreate the subject fresh so it is never in an errored/completed state
    refreshTokenSubject = new BehaviorSubject<string | null>(null);

    return authService.refreshToken().pipe(
      switchMap((response) => {
        isRefreshing = false;
        refreshTokenSubject.next(response.accessToken);

        return next(req.clone({
          setHeaders: { Authorization: `Bearer ${response.accessToken}` }
        }));
      }),
      catchError((err) => {
        isRefreshing = false;
        // Unblock any requests that are waiting — they will get null and fail gracefully
        refreshTokenSubject.next(null);
        // Only logout when the refresh endpoint itself returns 401 (token truly expired)
        if (err?.status === 401) {
          authService.logout();
        }
        return throwError(() => err);
      })
    );
  } else {
    // Another refresh is already in progress — wait for it
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => {
        return next(req.clone({
          setHeaders: { Authorization: `Bearer ${token!}` }
        }));
      })
    );
  }
}
