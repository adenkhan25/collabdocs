'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { DocumentItem } from '@/types';
import { toast } from 'sonner';

export function useTrash() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/documents/trash');
      setDocuments(data.documents);
    } catch (error) {
      toast.error('Failed to load trash');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const restoreDocument = async (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    try {
      await api.put(`/documents/${id}/restore`);
      toast.success('Document restored');
    } catch (error) {
      toast.error('Could not restore document');
      load();
    }
  };

  const permanentlyDelete = async (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    try {
      await api.delete(`/documents/${id}/permanent`);
      toast.success('Permanently deleted');
    } catch (error) {
      toast.error('Could not delete document');
      load();
    }
  };

  return { documents, loading, restoreDocument, permanentlyDelete, reload: load };
}
