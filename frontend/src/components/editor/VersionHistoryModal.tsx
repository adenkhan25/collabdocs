'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { History, RotateCcw, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { VersionItem } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VersionHistoryModalProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  canEdit: boolean;
  onRestored: () => void;
}

export function VersionHistoryModal({
  open,
  onClose,
  documentId,
  canEdit,
  onRestored,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VersionItem | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) loadVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/documents/${documentId}/versions`);
      setVersions(data.versions);
      setSelected(data.versions[0] || null);
    } catch (error) {
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSnapshot = async () => {
    setSaving(true);
    try {
      await api.post(`/documents/${documentId}/versions`, { label: 'Manual save' });
      toast.success('Snapshot saved');
      loadVersions();
    } catch (error) {
      toast.error('Could not save snapshot');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    setRestoring(true);
    try {
      await api.put(`/documents/${documentId}/versions/${versionId}/restore`);
      toast.success('Version restored');
      onRestored();
      onClose();
    } catch (error) {
      toast.error('Could not restore version');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4.5 w-4.5" /> Version history
          </DialogTitle>
          <DialogDescription>Save snapshots and restore any previous version.</DialogDescription>
        </DialogHeader>

        {canEdit && (
          <Button variant="outline" size="sm" onClick={handleSaveSnapshot} loading={saving} className="mb-4 w-fit">
            <Save className="h-3.5 w-3.5" /> Save current version
          </Button>
        )}

        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2 max-h-96 space-y-1.5 overflow-y-auto border-r border-slate-100 pr-3 dark:border-slate-800">
            {loading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : versions.length === 0 ? (
              <p className="text-sm text-slate-400">No saved versions yet.</p>
            ) : (
              versions.map((v) => (
                <button
                  key={v._id}
                  onClick={() => setSelected(v)}
                  className={cn(
                    'flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors',
                    selected?._id === v._id
                      ? 'bg-brand-50 dark:bg-brand-500/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  )}
                >
                  <div className="flex w-full items-center gap-2">
                    <Avatar name={v.createdBy.name} color={v.createdBy.avatarColor} size="xs" />
                    <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {v.createdBy.name}
                    </span>
                  </div>
                  <span className="mt-0.5 text-xs text-slate-400">
                    {format(new Date(v.createdAt), 'MMM d, yyyy · h:mm a')}
                  </span>
                  {v.label && (
                    <span className="mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {v.label}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="col-span-3 max-h-96 overflow-y-auto pl-1">
            {selected ? (
              <>
                <div
                  className="tiptap-content prose-sm max-w-none rounded-lg border border-slate-100 p-4 text-sm dark:border-slate-800"
                  dangerouslySetInnerHTML={{ __html: selected.content }}
                />
                {canEdit && (
                  <Button
                    onClick={() => handleRestore(selected._id)}
                    loading={restoring}
                    size="sm"
                    className="mt-3"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restore this version
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400">Select a version to preview</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
