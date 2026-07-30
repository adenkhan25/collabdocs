export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  theme: 'light' | 'dark';
  createdAt?: string;
}

export type DocRole = 'owner' | 'editor' | 'viewer';

export interface Collaborator {
  user: User;
  role: 'editor' | 'viewer';
  addedAt?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  owner: User;
  collaborators: Collaborator[];
  isFavorite: boolean;
  isTrashed: boolean;
  trashedAt: string | null;
  shareEnabled: boolean;
  shareToken: string;
  shareRole: 'editor' | 'viewer';
  coverEmoji: string;
  lastEditedBy?: User;
  role: DocRole;
  createdAt: string;
  updatedAt: string;
}

export interface CommentReply {
  _id: string;
  author: User;
  text: string;
  createdAt: string;
}

export interface CommentItem {
  _id: string;
  document: string;
  author: User;
  text: string;
  highlightedText: string;
  rangeFrom: number | null;
  rangeTo: number | null;
  resolved: boolean;
  resolvedBy: User | null;
  resolvedAt: string | null;
  replies: CommentReply[];
  createdAt: string;
  updatedAt: string;
}

export interface VersionItem {
  _id: string;
  document: string;
  content: string;
  title: string;
  createdBy: User;
  label: string;
  wordCount: number;
  createdAt: string;
}

export interface ActivityItem {
  _id: string;
  user: User;
  document?: { _id: string; title: string } | null;
  type: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  recipient: string;
  sender: User | null;
  document: { _id: string; title: string } | null;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface PresenceUser {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  socketId: string;
  color: string;
  role: DocRole;
}

export interface ApiError {
  success: false;
  message: string;
}
