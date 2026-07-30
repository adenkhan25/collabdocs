'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, History, Share2, Activity, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PresenceAvatars } from './PresenceAvatars';
import { ExportMenu } from './ExportMenu';
import { DocumentItem, PresenceUser } from '@/types';
import { cn } from '@/lib/utils';

interface DocumentTopBarProps {
  document: DocumentItem;
  presence: PresenceUser[];
  connected: boolean;
  onTitleChange: (title: string) => void;
  onOpenShare: () => void;
  onOpenComments: () => void;
  onOpenVersions: () => void;
  onOpenActivity: () => void;
  commentsOpen: boolean;
  saving: boolean;
}

export function DocumentTopBar({
  document,
  presence,
  connected,
  onTitleChange,
  onOpenShare,
  onOpenComments,
  onOpenVersions,
  onOpenActivity,
  commentsOpen,
  saving,
}: DocumentTopBarProps) {
  const router = useRouter();
  const [title, setTitle] = useState(document.title);

  return (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
      <button
        onClick={() => router.push('/dashboard')}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <ArrowLeft className="h-4.5 w-4.5" />
      </button>

      <span className="text-xl shrink-0">{document.coverEmoji}</span>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title.trim() && title !== document.title && onTitleChange(title.trim())}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="h-9 max-w-xs border-none bg-transparent px-2 font-display text-base font-semibold shadow-none focus:bg-slate-50 dark:focus:bg-slate-800"
        disabled={document.role === 'viewer'}
      />

      <div className="flex items-center gap-1 text-xs text-slate-400">
        {connected ? (
          <Wifi className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-red-400" />
        )}
        {saving && <span className="animate-pulse">Saving...</span>}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <PresenceAvatars users={presence} />

        <Button
          variant={commentsOpen ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onOpenComments}
        >
          <MessageSquare className="h-3.5 w-3.5" /> Comments
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpenVersions}>
          <History className="h-3.5 w-3.5" /> History
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpenActivity}>
          <Activity className="h-3.5 w-3.5" /> Activity
        </Button>
        <ExportMenu documentId={document.id} />
        {document.role === 'owner' && (
          <Button size="sm" onClick={onOpenShare}>
            <Share2 className="h-3.5 w-3.5" /> Share
          </Button>
        )}
      </div>
    </div>
  );
}
