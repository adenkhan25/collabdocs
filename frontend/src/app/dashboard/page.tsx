'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { DocumentCard } from '@/components/dashboard/DocumentCard';
import { DocumentGridSkeleton } from '@/components/dashboard/DocumentGridSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const router = useRouter();
  const {
    documents,
    loading,
    toggleFavorite,
    trashDocument,
    duplicateDocument,
    renameDocument,
  } = useDocuments('all', search);

  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/documents', { title: 'Untitled Document' });
      router.push(`/documents/${data.document.id}`);
    } catch (error) {
      toast.error('Could not create document');
    } finally {
      setCreating(false);
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <DashboardShell onSearch={setSearch}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {greeting}, {user?.name?.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {documents.length} document{documents.length !== 1 ? 's' : ''} in your workspace
            </p>
          </div>
          <Button onClick={handleCreate} loading={creating}>
            <Plus className="h-4 w-4" />
            New Document
          </Button>
        </div>

        {loading ? (
          <DocumentGridSkeleton />
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={search ? 'No matching documents' : 'No documents yet'}
            description={
              search
                ? 'Try a different search term.'
                : 'Create your first document to get started with real-time collaboration.'
            }
            action={
              !search && (
                <Button onClick={handleCreate} loading={creating}>
                  <Plus className="h-4 w-4" /> Create Document
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onToggleFavorite={toggleFavorite}
                onTrash={trashDocument}
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
