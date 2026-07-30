const Y = require('yjs');
const Document = require('../models/Document');

// Holds live Y.Doc instances in memory, keyed by documentId, while at least
// one client is connected to that document. Debounces writes to MongoDB so
// we don't hit the DB on every keystroke.
const docs = new Map(); // documentId -> { ydoc, saveTimeout, connections }

const SAVE_DEBOUNCE_MS = 2000;

const getOrCreateDoc = async (documentId) => {
  if (docs.has(documentId)) {
    return docs.get(documentId);
  }

  const ydoc = new Y.Doc();
  const dbDoc = await Document.findById(documentId).select('yjsState');

  if (dbDoc && dbDoc.yjsState && dbDoc.yjsState.length > 0) {
    try {
      Y.applyUpdate(ydoc, new Uint8Array(dbDoc.yjsState));
    } catch (err) {
      console.error(`Failed to apply stored Yjs state for doc ${documentId}:`, err.message);
    }
  }

  const entry = { ydoc, saveTimeout: null, connections: 0 };
  docs.set(documentId, entry);
  return entry;
};

const scheduleSave = (documentId) => {
  const entry = docs.get(documentId);
  if (!entry) return;

  if (entry.saveTimeout) clearTimeout(entry.saveTimeout);

  entry.saveTimeout = setTimeout(async () => {
    try {
      const update = Y.encodeStateAsUpdate(entry.ydoc);
      await Document.findByIdAndUpdate(documentId, { yjsState: Buffer.from(update) });
    } catch (err) {
      console.error(`Failed to persist Yjs state for doc ${documentId}:`, err.message);
    }
  }, SAVE_DEBOUNCE_MS);
};

const releaseDoc = async (documentId) => {
  const entry = docs.get(documentId);
  if (!entry) return;

  entry.connections -= 1;

  if (entry.connections <= 0) {
    // Final save before evicting from memory
    if (entry.saveTimeout) clearTimeout(entry.saveTimeout);
    try {
      const update = Y.encodeStateAsUpdate(entry.ydoc);
      await Document.findByIdAndUpdate(documentId, { yjsState: Buffer.from(update) });
    } catch (err) {
      console.error(`Failed to persist Yjs state on release for doc ${documentId}:`, err.message);
    }
    entry.ydoc.destroy();
    docs.delete(documentId);
  }
};

module.exports = { getOrCreateDoc, scheduleSave, releaseDoc, docs };
