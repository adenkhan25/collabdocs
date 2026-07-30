'use client';

import { Trash2 } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { DocumentCard } from '@/components/dashboard/DocumentCard';
import { DocumentGridSkeleton } from '@/components/dashboard/DocumentGridSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { useTrash } from '@/hooks/useTrash';

export default function TrashPage() {
  const { documents, loading, restoreDocument, permanentlyDelete } = useTrash();

  return (
    <DashboardShell showSearch={false}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Trash</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Deleted documents are kept here until you permanently remove them
          </p>
        </div>

        {loading ? (
          <DocumentGridSkeleton count={4} />
        ) : documents.length === 0 ? (
          <EmptyState icon={Trash2} title="Trash is empty" description="Deleted documents will appear here." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onToggleFavorite={() => {}}
                onRestore={restoreDocument}
                onPermanentDelete={permanentlyDelete}
                variant="trash"
              />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
