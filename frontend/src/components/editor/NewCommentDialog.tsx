'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface NewCommentDialogProps {
  open: boolean;
  highlightedText: string;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

export function NewCommentDialog({ open, highlightedText, onClose, onSubmit }: NewCommentDialogProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add comment</DialogTitle>
        </DialogHeader>
        {highlightedText && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm italic text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            &ldquo;{highlightedText}&rdquo;
          </p>
        )}
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          rows={4}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Comment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
