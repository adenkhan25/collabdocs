const Y = require('yjs');
const Document = require('../models/Document');
const socketAuth = require('./socketAuth');
const { getOrCreateDoc, scheduleSave, releaseDoc } = require('./docStore');

// Tracks which room(s) each socket has joined and the presence info shown to others
const socketRooms = new Map(); // socketId -> Set(documentId)
const roomPresence = new Map(); // documentId -> Map(socketId -> { id, name, email, avatarColor, color })

const CURSOR_COLORS = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b',
  '#06b6d4', '#8b5cf6', '#ef4444', '#3b82f6',
];

const roomName = (documentId) => `doc:${documentId}`;

const getPresenceList = (documentId) => {
  const map = roomPresence.get(documentId);
  if (!map) return [];
  return Array.from(map.values());
};

const checkAccess = async (documentId, userId) => {
  const doc = await Document.findById(documentId);
  if (!doc || doc.isTrashed) return null;
  const role = doc.getUserRole(userId);
  return role ? { doc, role } : null;
};

const initCollaborationSocket = (io) => {
  io.use(socketAuth);

  io.on('connection', (socket) => {
    socketRooms.set(socket.id, new Set());

    socket.on('join-document', async ({ documentId }, callback) => {
      try {
        const access = await checkAccess(documentId, socket.user.id);
        if (!access) {
          if (callback) callback({ success: false, message: 'Access denied' });
          return;
        }

        const room = roomName(documentId);
        socket.join(room);
        socketRooms.get(socket.id).add(documentId);

        const entry = await getOrCreateDoc(documentId);
        entry.connections += 1;

        if (!roomPresence.has(documentId)) {
          roomPresence.set(documentId, new Map());
        }
        const presenceMap = roomPresence.get(documentId);
        const color = CURSOR_COLORS[presenceMap.size % CURSOR_COLORS.length];
        presenceMap.set(socket.id, { ...socket.user, socketId: socket.id, color, role: access.role });

        const stateVector = Y.encodeStateAsUpdate(entry.ydoc);

        if (callback) {
          callback({
            success: true,
            yjsState: Buffer.from(stateVector).toString('base64'),
            content: access.doc.content,
            role: access.role,
          });
        }

        socket.to(room).emit('user-joined', {
          user: socket.user,
          socketId: socket.id,
          color,
        });

        io.to(room).emit('presence-update', getPresenceList(documentId));
      } catch (error) {
        console.error('join-document error:', error.message);
        if (callback) callback({ success: false, message: 'Server error joining document' });
      }
    });

    socket.on('yjs-update', async ({ documentId, update }) => {
      try {
        const access = await checkAccess(documentId, socket.user.id);
        if (!access || access.role === 'viewer') return;

        const entry = await getOrCreateDoc(documentId);
        const updateBytes = new Uint8Array(Buffer.from(update, 'base64'));
        Y.applyUpdate(entry.ydoc, updateBytes, 'remote');

        socket.to(roomName(documentId)).emit('yjs-update', { update, socketId: socket.id });

        scheduleSave(documentId);
      } catch (error) {
        console.error('yjs-update error:', error.message);
      }
    });

    socket.on('awareness-update', ({ documentId, update, cursor }) => {
      socket.to(roomName(documentId)).emit('awareness-update', {
        socketId: socket.id,
        user: socket.user,
        update,
        cursor,
      });
    });

    socket.on('typing', ({ documentId, isTyping }) => {
      socket.to(roomName(documentId)).emit('typing', {
        socketId: socket.id,
        user: socket.user,
        isTyping,
      });
    });

    socket.on('content-sync', async ({ documentId, content }) => {
      try {
        const access = await checkAccess(documentId, socket.user.id);
        if (!access || access.role === 'viewer') return;
        await Document.findByIdAndUpdate(documentId, {
          content,
          lastEditedBy: socket.user.id,
        });
      } catch (error) {
        console.error('content-sync error:', error.message);
      }
    });

    socket.on('leave-document', async ({ documentId }) => {
      await handleLeave(socket, documentId, io);
    });

    socket.on('disconnect', async () => {
      const rooms = socketRooms.get(socket.id);
      if (rooms) {
        for (const documentId of rooms) {
          await handleLeave(socket, documentId, io);
        }
      }
      socketRooms.delete(socket.id);
    });
  });
};

const handleLeave = async (socket, documentId, io) => {
  const room = roomName(documentId);
  socket.leave(room);

  const rooms = socketRooms.get(socket.id);
  if (rooms) rooms.delete(documentId);

  const presenceMap = roomPresence.get(documentId);
  if (presenceMap) {
    presenceMap.delete(socket.id);
    if (presenceMap.size === 0) {
      roomPresence.delete(documentId);
    }
  }

  io.to(room).emit('user-left', { socketId: socket.id, user: socket.user });
  io.to(room).emit('presence-update', getPresenceList(documentId));

  await releaseDoc(documentId);
};

module.exports = initCollaborationSocket;
