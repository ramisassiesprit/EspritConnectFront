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

export interface EspritProfile {
  id?: string;
  fieldOfStudy?: string;
  degree?: string;
  graduationYear?: number;
  program?: string;
  institution?: string;
}

export interface WillingToHelp {
  id?: string;
  offerHelp?: string;
  seekHelp?: string;
  offerMentor?: string;
  seekMentor?: string;
}

export interface WorkExperience {
  id?: string;
  company?: string;
  jobTitle?: string;
  industry?: string;
  jobFunction?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface OtherEducation {
  id?: string;
  institutionName?: string;
  degree?: string;
  graduationYear?: number;
}

export interface Skill {
  id?: string;
  name?: string;
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
  code?: string;
  companyName?: string;
  jobTitle?: string;
  jobFunction?: string;
  industry?: string;
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
  espritProfile?: EspritProfile;
  willingToHelps?: WillingToHelp[];
  workExperiences?: WorkExperience[];
  otherEducations?: OtherEducation[];
  skills?: Skill[];
  cvUrl?: string;
  cvKeywords?: string;
}
