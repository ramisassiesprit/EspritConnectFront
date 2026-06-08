import { User } from './user.model';

export interface Message {
  id?: string;
  senderId: string;
  senderName?: string;
  receiverId: string;
  content: string;
  isRead?: boolean;
  sentAt?: string;
  edited?: boolean;
}
