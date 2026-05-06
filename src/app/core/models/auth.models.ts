import { UserRole } from './user-role.enum';

export interface AuthRequest {
  email: string;
  password?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  userId: string;
  role: UserRole;
  expiresIn: number;
}

export interface UserSession {
  token: string;
  role: UserRole;
  userId: string;
}
