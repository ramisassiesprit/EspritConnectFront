export interface Group {
  id: string;
  groupName: string;
  description: string;
  website?: string;
  logoUrl?: string;
  bannerUrl?: string;
  privacy?: GroupPrivacy;
  status?: GroupStatus;
  tagging?: boolean;
  labels?: string;
  location?: string;
  affiliation?: string;
  fieldOfStudy?: string;
  degree?: string;
  graduationYear?: string;
  institutionProgram?: string;
  otherDegree?: string;
  otherGraduationYear?: string;
  company?: string;
  industry?: string;
  jobFunction?: string;
  willingOffering?: string;
  willingSeeking?: string;
  mentoringOffering?: string;
  mentoringSeeking?: string;
  addMembers?: string;
  membersCount?: number;
  creatorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GroupCreateRequest {
  groupName: string;
  description: string;
  website?: string;
  logoUrl?: string;
  bannerUrl?: string;
  privacy?: GroupPrivacy;
  tagging?: boolean;
  labels?: string;
  location?: string;
  affiliation?: string;
  fieldOfStudy?: string;
  degree?: string;
  graduationYear?: string;
  institutionProgram?: string;
  otherDegree?: string;
  otherGraduationYear?: string;
  company?: string;
  industry?: string;
  jobFunction?: string;
  willingOffering?: string;
  willingSeeking?: string;
  mentoringOffering?: string;
  mentoringSeeking?: string;
  addMembers?: string;
}

export enum GroupPrivacy {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  SECRET = 'SECRET'
}

export enum GroupStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
