import { UserRole } from './user-role.enum';

export interface AuthRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  avatarUrl?: string | ArrayBuffer | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: string;
  role: UserRole;
  expiresIn: number;
}

export interface UserSession {
  token: string;
  refreshToken: string;
  role: UserRole;
  userId: string;
}
