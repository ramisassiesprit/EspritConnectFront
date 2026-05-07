export interface EspritProfile {
  id?: string;
  studentNumber: string;
  fieldOfStudy: string;
  degree: string;
  graduationYear: number;
  program: string;
  institution: string;
}

export interface WorkExperience {
  id?: string;
  company: string;
  jobTitle: string;
  industry: string;
  jobFunction: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
}

export interface OtherEducation {
  id?: string;
  institutionName: string;
  degree: string;
  graduationYear: number;
}

export interface Skill {
  id?: string;
  name: string;
}

export interface WillingToHelp {
  id?: string;
  offering: string;
  seeking: string;
}
