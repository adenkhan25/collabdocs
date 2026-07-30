'use client';

import { useState } from 'react';
import { Check, Copy, Globe, Lock, Trash2, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DocumentItem } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  document: DocumentItem;
  onUpdate: (doc: DocumentItem) => void;
  isOwner: boolean;
}

export function ShareModal({ open, onClose, document, onUpdate, isOwner }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/shared/${document.shareToken}`
      : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleShareEnabled = async (enabled: boolean) => {
    try {
      const { data } = await api.put(`/documents/${document.id}/share-settings`, {
        shareEnabled: enabled,
      });
      onUpdate(data.document);
    } catch (error) {
      toast.error('Could not update sharing settings');
    }
  };

  const updateShareRole = async (newRole: 'editor' | 'viewer') => {
    try {
      const { data } = await api.put(`/documents/${document.id}/share-settings`, {
        shareRole: newRole,
      });
      onUpdate(data.document);
    } catch (error) {
      toast.error('Could not update role');
    }
  };

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    try {
      const { data } = await api.post(`/documents/${document.id}/collaborators`, {
        email: email.trim(),
        role,
      });
      onUpdate(data.document);
      setEmail('');
      toast.success('Invitation sent');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not add collaborator');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await api.delete(`/documents/${document.id}/collaborators/${userId}`);
      onUpdate({
        ...document,
        collaborators: document.collaborators.filter((c) => c.user.id !== userId),
      });
      toast.success('Access removed');
    } catch (error) {
      toast.error('Could not remove collaborator');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share &ldquo;{document.title}&rdquo;</DialogTitle>
          <DialogDescription>Invite people or share a link with view/edit access.</DialogDescription>
        </DialogHeader>

        {isOwner && (
          <div className="mb-5 flex gap-2">
            <Input
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0 capitalize">
                  {role}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRole('viewer')}>Viewer</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRole('editor')}>Editor</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleInvite} loading={inviting} size="icon" className="shrink-0">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="mb-4 max-h-40 space-y-2 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar name={document.owner.name} color={document.owner.avatarColor} size="sm" />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {document.owner.name}
                </p>
                <p className="text-xs text-slate-400">{document.owner.email}</p>
              </div>
            </div>
            <Badge variant="secondary">Owner</Badge>
          </div>
          {document.collaborators.map((collab) => (
            <div key={collab.user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar name={collab.user.name} color={collab.user.avatarColor} size="sm" />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {collab.user.name}
                  </p>
                  <p className="text-xs text-slate-400">{collab.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {collab.role}
                </Badge>
                {isOwner && (
                  <button
                    onClick={() => handleRemove(collab.user.id)}
                    className="text-slate-300 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {document.shareEnabled ? (
                <Globe className="h-4 w-4 text-brand-600" />
              ) : (
                <Lock className="h-4 w-4 text-slate-400" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {document.shareEnabled ? 'Anyone with the link' : 'Link sharing off'}
                </p>
                <p className="text-xs text-slate-400">
                  {document.shareEnabled ? `Can ${document.shareRole}` : 'Only invited people can access'}
                </p>
              </div>
            </div>
            {isOwner && (
              <Switch checked={document.shareEnabled} onCheckedChange={toggleShareEnabled} />
            )}
          </div>

          {document.shareEnabled && (
            <div className="mt-3 flex items-center gap-2">
              <Input value={shareUrl} readOnly className="text-xs" />
              <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="shrink-0 capitalize">
                      {document.shareRole}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => updateShareRole('viewer')}>Viewer</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateShareRole('editor')}>Editor</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
