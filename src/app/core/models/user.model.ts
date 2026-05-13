import { UserRole } from './user-role.enum';

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED'
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  type: string;
  earnedAt: string;
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
  code?:string;
  companyName?:string;
  jobTitle?:string;
  jobFunction?:string;
  industry?:string;
  linkedinUrl?: string;
  githubUrl?: string;
  facebookUrl?: string;
  numTel?: number;
  isMentor?: boolean;
  mentorAvailable?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isOnline?: boolean;
  badges?: Badge[];
}
