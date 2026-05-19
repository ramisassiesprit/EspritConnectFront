import { User } from './user.model';

export interface PostFileDTO {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface PostDTO {
  id: string;
  user: Partial<User>;
  content: string;
  mediaUrl?: string;
  postType: string;
  isPinned: boolean;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  groupId?: string;
  images?: string[];
  files?: PostFileDTO[];
  liked?: boolean;
}

export interface CommentDTO {
  id: string;
  postId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  parentId?: string;
  replies?: CommentDTO[];
  content: string;
  createdAt: string;
  updatedAt: string;
}

