import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function truncate(text: string, length: number): string {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function wordCount(html: string): number {
  const text = stripHtml(html);
  return text ? text.split(/\s+/).length : 0;
}

export const ACTIVITY_LABELS: Record<string, string> = {
  user_login: 'Logged in',
  user_logout: 'Logged out',
  user_register: 'Created an account',
  document_created: 'Created document',
  document_edited: 'Edited document',
  document_renamed: 'Renamed document',
  document_deleted: 'Moved document to trash',
  document_restored: 'Restored document',
  document_permanently_deleted: 'Permanently deleted document',
  document_shared: 'Shared document',
  document_share_revoked: 'Revoked document access',
  comment_added: 'Added a comment',
  comment_resolved: 'Resolved a comment',
  comment_deleted: 'Deleted a comment',
  version_restored: 'Restored a previous version',
  password_changed: 'Changed password',
};
