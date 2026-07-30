'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { DocumentCard } from '@/components/dashboard/DocumentCard';
import { DocumentGridSkeleton } from '@/components/dashboard/DocumentGridSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { useDocuments } from '@/hooks/useDocuments';

export default function SharedPage() {
  const [search, setSearch] = useState('');
  const { documents, loading, toggleFavorite, duplicateDocument, renameDocument } = useDocuments(
    'shared',
    search
  );

  return (
    <DashboardShell onSearch={setSearch}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Shared with me
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Documents other people have shared with you
          </p>
        </div>

        {loading ? (
          <DocumentGridSkeleton count={4} />
        ) : documents.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nothing shared yet"
            description="Documents that others invite you to collaborate on will show up here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onToggleFavorite={toggleFavorite}
                onDuplicate={duplicateDocument}
                onRename={renameDocument}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
