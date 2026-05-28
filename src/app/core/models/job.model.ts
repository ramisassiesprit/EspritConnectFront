export type ContractType = 'CDI' | 'CDD' | 'INTERNSHIP' | 'FREELANCE' | 'PART_TIME' | 'VOLUNTEER';
export type JobStatus = 'PENDING' | 'OPEN' | 'CLOSED' | 'REJECTED' | 'DRAFT' | 'EXPIRED';
export type ApplicationStatus = 'PENDING' | 'REVIEWED' | 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED';

export interface JobOffer {
  id?: string;
  publisherId?: string;
  publisherName?: string;
  publisherAvatarUrl?: string;
  publisherJobTitle?: string;
  publisherCompanyName?: string;
  title: string;
  description?: string;
  company?: string;
  industry?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  contractType?: ContractType;
  experienceLevel?: string;
  deadline?: string;
  applyUrl?: string;
  attachmentUrl?: string;
  targetFields?: string[];
  imageUrl?: string;
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
  applicantFirstName?: string;
  applicantLastName?: string;
  applicantEmail?: string;
  applicantNumTel?: number;
  applicantAvatarUrl?: string;
  applicantJobTitle?: string;
  applicantIndustry?: string;
  applicantJobFunction?: string;
  applicantLinkedinUrl?: string;
  applicantGithubUrl?: string;
  applicantFacebookUrl?: string;
  applicantBio?: string;
  applicantGraduationYear?: number;
  applicantProgram?: string;
  applicantDegree?: string;
  applicantFieldOfStudy?: string;
  applicantInstitution?: string;
  status?: ApplicationStatus;
  appliedAt?: string;
  updatedAt?: string;
}
