'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Activity as ActivityIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar } from '@/components/ui/avatar';
import { ActivityItem } from '@/types';
import { ACTIVITY_LABELS } from '@/lib/utils';
import api from '@/lib/api';

export function DocumentActivityModal({
  open,
  onClose,
  documentId,
}: {
  open: boolean;
  onClose: () => void;
  documentId: string;
}) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get(`/documents/${documentId}/activity`)
      .then(({ data }) => setActivities(data.activities))
      .finally(() => setLoading(false));
  }, [open, documentId]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ActivityIcon className="h-4.5 w-4.5" /> Document activity
          </DialogTitle>
          <DialogDescription>Recent actions taken on this document.</DialogDescription>
        </DialogHeader>
        <div className="max-h-96 space-y-3 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-slate-400">No activity recorded yet.</p>
          ) : (
            activities.map((a) => (
              <div key={a._id} className="flex items-start gap-3">
                <Avatar name={a.user.name} color={a.user.avatarColor} size="sm" />
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium text-slate-900 dark:text-white">{a.user.name}</span>{' '}
                    {ACTIVITY_LABELS[a.type] || a.type}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
