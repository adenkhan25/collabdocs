'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Star, MoreHorizontal, Trash2, Copy, Pencil, Users, RotateCcw, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { DocumentItem } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { stripHtml, truncate } from '@/lib/utils';

interface DocumentCardProps {
  doc: DocumentItem;
  onToggleFavorite: (id: string) => void;
  onTrash?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onRename?: (id: string, title: string) => void;
  variant?: 'default' | 'trash';
}

export function DocumentCard({
  doc,
  onToggleFavorite,
  onTrash,
  onRestore,
  onPermanentDelete,
  onDuplicate,
  onRename,
  variant = 'default',
}: DocumentCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(doc.title);

  const submitRename = () => {
    setRenaming(false);
    if (title.trim() && title !== doc.title) {
      onRename?.(doc.id, title.trim());
    } else {
      setTitle(doc.title);
    }
  };

  const preview = truncate(stripHtml(doc.content), 90) || 'No content yet';

  const cardBody = (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-glow dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-xl dark:bg-slate-800">
          {doc.coverEmoji}
        </div>
        <div className="flex items-center gap-1">
          {variant === 'default' && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(doc.id);
              }}
              className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-slate-100 hover:text-amber-500 group-hover:opacity-100 dark:hover:bg-slate-800"
            >
              <Star className={doc.isFavorite ? 'h-4 w-4 fill-amber-400 text-amber-400 opacity-100' : 'h-4 w-4'} />
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.preventDefault()}
                className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-all hover:bg-slate-100 group-hover:opacity-100 dark:hover:bg-slate-800"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {variant === 'default' ? (
                <>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      setRenaming(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate?.(doc.id)}>
                    <Copy className="h-4 w-4" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem danger onClick={() => onTrash?.(doc.id)}>
                    <Trash2 className="h-4 w-4" /> Move to trash
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onRestore?.(doc.id)}>
                    <RotateCcw className="h-4 w-4" /> Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem danger onClick={() => onPermanentDelete?.(doc.id)}>
                    <XCircle className="h-4 w-4" /> Delete forever
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {renaming ? (
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={submitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitRename();
            if (e.key === 'Escape') {
              setTitle(doc.title);
              setRenaming(false);
            }
          }}
          className="mb-2 h-8"
          onClick={(e) => e.preventDefault()}
        />
      ) : (
        <h3 className="mb-1 truncate font-display text-[15px] font-semibold text-slate-900 dark:text-white">
          {doc.title}
        </h3>
      )}

      <p className="mb-4 line-clamp-2 min-h-[2.5rem] text-sm text-slate-500 dark:text-slate-400">
        {preview}
      </p>

      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Avatar name={doc.owner.name} color={doc.owner.avatarColor} size="xs" />
          {doc.collaborators.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {doc.collaborators.length}
            </Badge>
          )}
          {doc.role !== 'owner' && (
            <Badge variant="outline" className="capitalize">
              {doc.role}
            </Badge>
          )}
        </div>
        <span className="text-xs text-slate-400">
          {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </motion.div>
  );

  if (renaming) return <div>{cardBody}</div>;

  return <Link href={`/documents/${doc.id}`}>{cardBody}</Link>;
}
