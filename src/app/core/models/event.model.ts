export enum EventType {
  IN_PERSON = 'IN_PERSON',
  ONLINE = 'ONLINE',
  HYBRID = 'HYBRID'
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  UPCOMING = 'UPCOMING',
  PUBLISHED = 'PUBLISHED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum RegistrationStatus {
  REGISTERED = 'REGISTERED',
  ATTENDED = 'ATTENDED',
  CANCELLED = 'CANCELLED',
  WAITLISTED = 'WAITLISTED'
}

export interface Event {
  id?: string;
  title: string;
  description?: string;
  eventType: EventType;
  location?: string;
  meetingUrl?: string;
  startAt: string;
  endAt?: string;
  capacity?: number;
  waitlistEnabled?: boolean;
  registeredCount?: number;
  tags?: string;
  status?: EventStatus;
  coverUrl?: string;
  creatorId?: string;
  groupId?: string;
  createdAt?: string;
  updatedAt?: string;
  matchScore?: number;
}

export interface EventRegistration {
  id?: string;
  eventId: string;
  userId: string;
  userFullName: string;
  status: RegistrationStatus;
  registeredAt?: string;
  isWinner?: boolean;
  winnerRank?: number;
  feedbackRating?: number;
  feedbackComment?: string;
  checkedInAt?: string;
}
