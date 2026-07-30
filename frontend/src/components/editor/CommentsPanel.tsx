'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, MoreHorizontal, Send, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CommentItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CommentsPanelProps {
  comments: CommentItem[];
  activeCommentId: string | null;
  onClose: () => void;
  onReply: (commentId: string, text: string) => void;
  onResolve: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onSelectComment: (id: string | null) => void;
}

export function CommentsPanel({
  comments,
  activeCommentId,
  onClose,
  onReply,
  onResolve,
  onDelete,
  onSelectComment,
}: CommentsPanelProps) {
  const { user } = useAuth();
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [showResolved, setShowResolved] = useState(false);

  const visibleComments = comments.filter((c) => showResolved || !c.resolved);

  const submitReply = (commentId: string) => {
    const text = replyText[commentId]?.trim();
    if (!text) return;
    onReply(commentId, text);
    setReplyText((prev) => ({ ...prev, [commentId]: '' }));
  };

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
          Comments ({visibleComments.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResolved((s) => !s)}
            className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {showResolved ? 'Hide resolved' : 'Show resolved'}
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {visibleComments.length === 0 ? (
          <p className="mt-8 text-center text-sm text-slate-400">
            No comments yet. Select text and click the comment icon to add one.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleComments.map((comment) => (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onSelectComment(comment._id)}
                className={cn(
                  'cursor-pointer rounded-xl border p-3 transition-colors',
                  activeCommentId === comment._id
                    ? 'border-brand-300 bg-brand-50/60 dark:border-brand-700 dark:bg-brand-500/10'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50',
                  comment.resolved && 'opacity-60'
                )}
              >
                {comment.highlightedText && (
                  <p className="mb-2 truncate rounded-lg bg-amber-50 px-2 py-1 text-xs italic text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    &ldquo;{comment.highlightedText}&rdquo;
                  </p>
                )}
                <div className="flex items-start gap-2">
                  <Avatar name={comment.author.name} color={comment.author.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {comment.author.name}
                      </p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="text-slate-300 hover:text-slate-500"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onResolve(comment._id)}>
                            <Check className="h-3.5 w-3.5" />
                            {comment.resolved ? 'Unresolve' : 'Resolve'}
                          </DropdownMenuItem>
                          {comment.author.id === user?.id && (
                            <DropdownMenuItem danger onClick={() => onDelete(comment._id)}>
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{comment.text}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {comment.replies.length > 0 && (
                  <div className="ml-9 mt-2 flex flex-col gap-2 border-l border-slate-100 pl-3 dark:border-slate-800">
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className="flex items-start gap-2">
                        <Avatar name={reply.author.name} color={reply.author.avatarColor} size="xs" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {reply.author.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{reply.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!comment.resolved && (
                  <div
                    className="mt-2 flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      value={replyText[comment._id] || ''}
                      onChange={(e) =>
                        setReplyText((prev) => ({ ...prev, [comment._id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitReply(comment._id);
                      }}
                      placeholder="Reply..."
                      className="h-8 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    />
                    <button
                      onClick={() => submitReply(comment._id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
