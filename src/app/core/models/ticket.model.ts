import { User } from './user.model';

export interface TicketComment {
  id: string;
  content: string;
  isSolution: boolean;
  user: User;
  ticketPostId: string;
  upvotes: number;
  hasUpvoted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketPost {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  user: User;
  upvotes: number;
  hasUpvoted: boolean;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
}
