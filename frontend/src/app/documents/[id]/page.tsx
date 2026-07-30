'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DocumentTopBar } from '@/components/editor/DocumentTopBar';
import { EditorView } from '@/components/editor/EditorView';
import { CommentsPanel } from '@/components/editor/CommentsPanel';
import { NewCommentDialog } from '@/components/editor/NewCommentDialog';
import { ShareModal } from '@/components/editor/ShareModal';
import { VersionHistoryModal } from '@/components/editor/VersionHistoryModal';
import { DocumentActivityModal } from '@/components/editor/DocumentActivityModal';
import { useCollaboration } from '@/hooks/useCollaboration';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { DocumentItem, CommentItem, PresenceUser } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  const { socket, connected } = useSocket();
  const { user } = useAuth();

  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<{ from: number; to: number; text: string } | null>(null);
  const [newCommentOpen, setNewCommentOpen] = useState(false);

  const { ydoc, provider, role, ready, initialContent } = useCollaboration(documentId);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadDocument = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/documents/${documentId}`);
      setDoc(data.document);
    } catch (error: any) {
      setLoadError(error?.response?.data?.message || 'Document not found or access denied');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  const loadComments = useCallback(async () => {
    try {
      const { data } = await api.get(`/documents/${documentId}/comments`);
      setComments(data.comments);
    } catch (error) {
      // silent
    }
  }, [documentId]);

  useEffect(() => {
    loadDocument();
    loadComments();
  }, [loadDocument, loadComments]);

  useEffect(() => {
    if (!socket) return;

    const handlePresence = (list: PresenceUser[]) => setPresence(list);
    const handleUserJoined = (data: { user: { name: string } }) => {
      toast.message(`${data.user.name} joined the document`);
    };
    const handleUserLeft = (data: { user: { name: string } }) => {
      toast.message(`${data.user.name} left the document`);
    };

    socket.on('presence-update', handlePresence);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('presence-update', handlePresence);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket]);

  const handleContentChange = useCallback(
    (html: string) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setSaving(true);
      saveTimeoutRef.current = setTimeout(() => {
        socket?.emit('content-sync', { documentId, content: html });
        setSaving(false);
      }, 1200);
    },
    [socket, documentId]
  );

  const handleTitleChange = async (title: string) => {
    try {
      const { data } = await api.put(`/documents/${documentId}`, { title });
      setDoc(data.document);
    } catch (error) {
      toast.error('Could not rename document');
    }
  };

  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket?.emit('typing', { documentId, isTyping: true });
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('typing', { documentId, isTyping: false });
    }, 1500);
  }, [socket, documentId]);

  const handleSelectionChange = useCallback((from: number, to: number, text: string) => {
    if (text.trim().length > 0) {
      setPendingSelection({ from, to, text });
    } else {
      setPendingSelection(null);
    }
  }, []);

  const handleAddComment = () => {
    if (!pendingSelection) {
      toast.info('Select some text first to comment on it');
      return;
    }
    setNewCommentOpen(true);
  };

  const submitComment = async (text: string) => {
    try {
      const { data } = await api.post(`/documents/${documentId}/comments`, {
        text,
        highlightedText: pendingSelection?.text || '',
        rangeFrom: pendingSelection?.from ?? null,
        rangeTo: pendingSelection?.to ?? null,
      });
      setComments((prev) => [data.comment, ...prev]);
      setNewCommentOpen(false);
      setCommentsOpen(true);
      toast.success('Comment added');
    } catch (error) {
      toast.error('Could not add comment');
    }
  };

  const handleReply = async (commentId: string, text: string) => {
    try {
      const { data } = await api.post(`/documents/${documentId}/comments/${commentId}/replies`, { text });
      setComments((prev) => prev.map((c) => (c._id === commentId ? data.comment : c)));
    } catch (error) {
      toast.error('Could not add reply');
    }
  };

  const handleResolve = async (commentId: string) => {
    try {
      const { data } = await api.put(`/documents/${documentId}/comments/${commentId}/resolve`);
      setComments((prev) => prev.map((c) => (c._id === commentId ? { ...c, ...data.comment } : c)));
    } catch (error) {
      toast.error('Could not update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/documents/${documentId}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (error) {
      toast.error('Could not delete comment');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0b0d13]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (loadError || !doc) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center dark:bg-[#0b0d13]">
        <ShieldAlert className="h-10 w-10 text-red-400" />
        <p className="font-display text-lg font-semibold text-slate-800 dark:text-white">
          {loadError || 'Something went wrong'}
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const canEdit = (role || doc.role) !== 'viewer';

  return (
    <ProtectedRoute>
      <div className={cn('flex h-screen flex-col bg-slate-50 dark:bg-[#0b0d13]', fullscreen && 'fixed inset-0 z-50')}>
        <DocumentTopBar
          document={doc}
          presence={presence}
          connected={connected}
          onTitleChange={handleTitleChange}
          onOpenShare={() => setShareOpen(true)}
          onOpenComments={() => setCommentsOpen((s) => !s)}
          onOpenVersions={() => setVersionsOpen(true)}
          onOpenActivity={() => setActivityOpen(true)}
          commentsOpen={commentsOpen}
          saving={saving}
        />

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 bg-white dark:bg-[#0b0d13]">
            {ready && ydoc && provider ? (
              <EditorView
                ydoc={ydoc}
                provider={provider}
                initialContent={initialContent || doc.content}
                canEdit={canEdit}
                fullscreen={fullscreen}
                onToggleFullscreen={() => setFullscreen((f) => !f)}
                onAddComment={handleAddComment}
                onCommentClick={setActiveCommentId}
                onContentChange={handleContentChange}
                onSelectionChange={handleSelectionChange}
                onTyping={handleTyping}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
              </div>
            )}
          </div>

          {commentsOpen && (
            <CommentsPanel
              comments={comments}
              activeCommentId={activeCommentId}
              onClose={() => setCommentsOpen(false)}
              onReply={handleReply}
              onResolve={handleResolve}
              onDelete={handleDeleteComment}
              onSelectComment={setActiveCommentId}
            />
          )}
        </div>
      </div>

      <NewCommentDialog
        open={newCommentOpen}
        highlightedText={pendingSelection?.text || ''}
        onClose={() => setNewCommentOpen(false)}
        onSubmit={submitComment}
      />

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        document={doc}
        onUpdate={setDoc}
        isOwner={doc.role === 'owner'}
      />

      <VersionHistoryModal
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        documentId={documentId}
        canEdit={canEdit}
        onRestored={loadDocument}
      />

      <DocumentActivityModal open={activityOpen} onClose={() => setActivityOpen(false)} documentId={documentId} />
    </ProtectedRoute>
  );
}
