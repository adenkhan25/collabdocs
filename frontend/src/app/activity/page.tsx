'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Activity as ActivityIcon } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { EmptyState } from '@/components/EmptyState';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityItem } from '@/types';
import { ACTIVITY_LABELS } from '@/lib/utils';
import api from '@/lib/api';

export default function ActivityPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/activity')
      .then(({ data }) => setActivities(data.activities))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell showSearch={false}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Activity</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            A history of your actions across all documents
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="No activity yet"
            description="Actions you take across documents will show up here."
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {activities.map((a, i) => (
              <div
                key={a._id}
                className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 last:border-0 dark:border-slate-800"
              >
                <Avatar name={user?.name || ''} color={user?.avatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {ACTIVITY_LABELS[a.type] || a.type}
                    {a.document && (
                      <>
                        {' '}
                        on{' '}
                        <Link
                          href={`/documents/${a.document._id}`}
                          className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {a.document.title}
                        </Link>
                      </>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
