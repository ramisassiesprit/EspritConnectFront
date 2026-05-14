export type ContractType = 'CDI' | 'CDD' | 'INTERNSHIP' | 'FREELANCE' | 'PART_TIME' | 'VOLUNTEER';
export type JobStatus = 'OPEN' | 'CLOSED' | 'DRAFT' | 'EXPIRED';
export type ApplicationStatus = 'PENDING' | 'REVIEWED' | 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED';

export interface JobOffer {
  id?: string;
  publisherId?: string;
  title: string;
  description?: string;
  company?: string;
  industry?: string;
  location?: string;
  contractType?: ContractType;
  experienceLevel?: string;
  deadline?: string;
  status: JobStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobApplication {
  id?: string;
  jobOfferId: string;
  applicantId?: string;
  cvUrl?: string;
  coverLetterUrl?: string;
  status?: ApplicationStatus;
  appliedAt?: string;
  updatedAt?: string;
}
