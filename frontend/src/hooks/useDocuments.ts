'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { DocumentItem } from '@/types';
import { toast } from 'sonner';

type Filter = 'all' | 'favorites' | 'owned' | 'shared';

export function useDocuments(filter: Filter = 'all', search = '') {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter !== 'all') params.filter = filter;
      if (search) params.search = search;
      const { data } = await api.get('/documents', { params });
      setDocuments(data.documents);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFavorite = async (id: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isFavorite: !d.isFavorite } : d))
    );
    try {
      await api.put(`/documents/${id}/favorite`);
    } catch (error) {
      toast.error('Could not update favorite');
      load();
    }
  };

  const trashDocument = async (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Moved to trash');
    } catch (error) {
      toast.error('Could not delete document');
      load();
    }
  };

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

  const renameDocument = async (id: string, title: string) => {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, title } : d)));
    try {
      await api.put(`/documents/${id}`, { title });
    } catch (error) {
      toast.error('Could not rename document');
      load();
    }
  };

  const duplicateDocument = async (id: string) => {
    try {
      const { data } = await api.post(`/documents/${id}/duplicate`);
      setDocuments((prev) => [data.document, ...prev]);
      toast.success('Document duplicated');
    } catch (error) {
      toast.error('Could not duplicate document');
    }
  };

  return {
    documents,
    loading,
    reload: load,
    toggleFavorite,
    trashDocument,
    restoreDocument,
    permanentlyDelete,
    renameDocument,
    duplicateDocument,
  };
}
