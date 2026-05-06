import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserStatus } from '../../models/user.model';
import { UserRole } from '../../models/user-role.enum';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:8086/EspritConnect/admin';

  constructor(private http: HttpClient) {}

  getUsersByRole(role: UserRole): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/role/${role}`);
  }

  updateUserStatus(userId: string, status: UserStatus): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/users/${userId}/status`, null, {
      params: { status }
    });
  }
}
