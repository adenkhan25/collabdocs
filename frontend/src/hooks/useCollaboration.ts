'use client';

import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { DocRole } from '@/types';

const toBase64 = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof window !== 'undefined' ? window.btoa(binary) : Buffer.from(bytes).toString('base64');
};

const fromBase64 = (str: string) => {
  if (typeof window === 'undefined') return new Uint8Array(Buffer.from(str, 'base64'));
  const binary = window.atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

interface UseCollaborationResult {
  ydoc: Y.Doc | null;
  provider: { awareness: awarenessProtocol.Awareness } | null;
  role: DocRole | null;
  ready: boolean;
  initialContent: string;
}

export function useCollaboration(documentId: string): UseCollaborationResult {
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<DocRole | null>(null);
  const [initialContent, setInitialContent] = useState('');

  const ydocRef = useRef<Y.Doc | null>(null);
  const awarenessRef = useRef<awarenessProtocol.Awareness | null>(null);
  const joinedRef = useRef(false);

  if (!ydocRef.current) {
    ydocRef.current = new Y.Doc();
  }
  if (!awarenessRef.current && ydocRef.current) {
    awarenessRef.current = new awarenessProtocol.Awareness(ydocRef.current);
  }

  useEffect(() => {
    if (!socket || !connected || !documentId || joinedRef.current) return;
    const ydoc = ydocRef.current!;
    const awareness = awarenessRef.current!;

    joinedRef.current = true;

    const handleUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote') return;
      socket.emit('yjs-update', { documentId, update: toBase64(update) });
    };
    ydoc.on('update', handleUpdate);

    const handleAwarenessUpdate = (
      { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown
    ) => {
      if (origin === 'remote') return;
      const changed = added.concat(updated, removed);
      const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changed);
      socket.emit('awareness-update', { documentId, update: toBase64(update) });
    };
    awareness.on('update', handleAwarenessUpdate);

    const handleRemoteYjsUpdate = ({ update, socketId }: { update: string; socketId: string }) => {
      if (socketId === socket.id) return;
      Y.applyUpdate(ydoc, fromBase64(update), 'remote');
    };
    socket.on('yjs-update', handleRemoteYjsUpdate);

    const handleRemoteAwareness = ({ update }: { update: string }) => {
      awarenessProtocol.applyAwarenessUpdate(awareness, fromBase64(update), 'remote');
    };
    socket.on('awareness-update', handleRemoteAwareness);

    socket.emit(
      'join-document',
      { documentId },
      (response: { success: boolean; yjsState?: string; content?: string; role?: DocRole; message?: string }) => {
        if (!response.success) {
          setReady(false);
          return;
        }
        if (response.yjsState) {
          Y.applyUpdate(ydoc, fromBase64(response.yjsState), 'remote');
        }
        setInitialContent(response.content || '');
        setRole(response.role || null);
        setReady(true);

        if (user) {
          awareness.setLocalStateField('user', {
            name: user.name,
            color: user.avatarColor,
          });
        }
      }
    );

    return () => {
      ydoc.off('update', handleUpdate);
      awareness.off('update', handleAwarenessUpdate);
      socket.off('yjs-update', handleRemoteYjsUpdate);
      socket.off('awareness-update', handleRemoteAwareness);
      socket.emit('leave-document', { documentId });
      joinedRef.current = false;
    };
  }, [socket, connected, documentId, user]);

  return {
    ydoc: ydocRef.current,
    provider: awarenessRef.current ? { awareness: awarenessRef.current } : null,
    role,
    ready,
    initialContent,
  };
}
