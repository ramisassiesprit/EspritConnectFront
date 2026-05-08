import { UserRole } from './user-role.enum';

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  city?: string;
  country?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  facebookUrl?: string;
  numTel?: number;
  isMentor?: boolean;
  mentorAvailable?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
