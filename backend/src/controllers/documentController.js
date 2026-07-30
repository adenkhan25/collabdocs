const Document = require('../models/Document');
const Comment = require('../models/Comment');
const Version = require('../models/Version');
const Notification = require('../models/Notification');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const logActivity = require('../utils/logActivity');

const populateFields = 'name email avatarColor';

const serializeDoc = (doc, userId) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id,
    title: obj.title,
    content: obj.content,
    owner: obj.owner,
    collaborators: obj.collaborators,
    isFavorite: (obj.favoritedBy || []).some((u) => u.toString() === userId.toString()),
    isTrashed: obj.isTrashed,
    trashedAt: obj.trashedAt,
    shareEnabled: obj.shareEnabled,
    shareToken: obj.shareToken,
    shareRole: obj.shareRole,
    coverEmoji: obj.coverEmoji,
    lastEditedBy: obj.lastEditedBy,
    role: doc.getUserRole ? doc.getUserRole(userId) : undefined,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

// @desc    Create a new document
// @route   POST /api/documents
// @access  Private
const createDocument = asyncHandler(async (req, res) => {
  const { title } = req.body;

  const doc = await Document.create({
    title: title || 'Untitled Document',
    content: '',
    owner: req.user._id,
  });

  await logActivity({ user: req.user._id, document: doc._id, type: 'document_created' });

  res.status(201).json({ success: true, document: serializeDoc(doc, req.user._id) });
});

// @desc    Get all documents for user (dashboard) - owned + shared, excluding trash
// @route   GET /api/documents
// @access  Private
const getDocuments = asyncHandler(async (req, res) => {
  const { search, filter } = req.query;
  const userId = req.user._id;

  let query = {
    isTrashed: false,
    $or: [{ owner: userId }, { 'collaborators.user': userId }],
  };

  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  if (filter === 'favorites') {
    query.favoritedBy = userId;
  }

  if (filter === 'owned') {
    query = { isTrashed: false, owner: userId };
    if (search) query.title = { $regex: search, $options: 'i' };
  }

  if (filter === 'shared') {
    query = { isTrashed: false, 'collaborators.user': userId };
    if (search) query.title = { $regex: search, $options: 'i' };
  }

  const docs = await Document.find(query)
    .populate('owner', populateFields)
    .populate('collaborators.user', populateFields)
    .populate('lastEditedBy', populateFields)
    .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    count: docs.length,
    documents: docs.map((d) => serializeDoc(d, userId)),
  });
});

// @desc    Get recent documents (last 8 edited)
// @route   GET /api/documents/recent
// @access  Private
const getRecentDocuments = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const docs = await Document.find({
    isTrashed: false,
    $or: [{ owner: userId }, { 'collaborators.user': userId }],
  })
    .populate('owner', populateFields)
    .sort({ updatedAt: -1 })
    .limit(8);

  res.status(200).json({ success: true, documents: docs.map((d) => serializeDoc(d, userId)) });
});

// @desc    Get trashed documents
// @route   GET /api/documents/trash
// @access  Private
const getTrash = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const docs = await Document.find({ owner: userId, isTrashed: true })
    .populate('owner', populateFields)
    .sort({ trashedAt: -1 });

  res.status(200).json({ success: true, documents: docs.map((d) => serializeDoc(d, userId)) });
});

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private (requireDocAccess)
const getDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.document._id)
    .populate('owner', populateFields)
    .populate('collaborators.user', populateFields)
    .populate('lastEditedBy', populateFields);

  res.status(200).json({ success: true, document: serializeDoc(doc, req.user._id) });
});

// @desc    Update document content/title
// @route   PUT /api/documents/:id
// @access  Private (editor+)
const updateDocument = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const doc = req.document;

  const wasRenamed = title !== undefined && title !== doc.title;

  if (title !== undefined) doc.title = title;
  if (content !== undefined) doc.content = content;
  doc.lastEditedBy = req.user._id;

  await doc.save();

  if (wasRenamed) {
    await logActivity({
      user: req.user._id,
      document: doc._id,
      type: 'document_renamed',
      meta: { newTitle: title },
    });
  } else {
    await logActivity({ user: req.user._id, document: doc._id, type: 'document_edited' });
  }

  res.status(200).json({ success: true, document: serializeDoc(doc, req.user._id) });
});

// @desc    Move document to trash
// @route   DELETE /api/documents/:id
// @access  Private (owner)
const trashDocument = asyncHandler(async (req, res) => {
  const doc = req.document;
  doc.isTrashed = true;
  doc.trashedAt = new Date();
  await doc.save();

  await logActivity({ user: req.user._id, document: doc._id, type: 'document_deleted' });

  res.status(200).json({ success: true, message: 'Document moved to trash' });
});

// @desc    Restore document from trash
// @route   PUT /api/documents/:id/restore
// @access  Private (owner)
const restoreDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, owner: req.user._id });

  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found in trash' });
  }

  doc.isTrashed = false;
  doc.trashedAt = null;
  await doc.save();

  await logActivity({ user: req.user._id, document: doc._id, type: 'document_restored' });

  res.status(200).json({ success: true, document: serializeDoc(doc, req.user._id) });
});

// @desc    Permanently delete document
// @route   DELETE /api/documents/:id/permanent
// @access  Private (owner)
const permanentlyDeleteDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, owner: req.user._id });

  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  await Comment.deleteMany({ document: doc._id });
  await Version.deleteMany({ document: doc._id });
  await doc.deleteOne();

  await logActivity({ user: req.user._id, type: 'document_permanently_deleted', meta: { title: doc.title } });

  res.status(200).json({ success: true, message: 'Document permanently deleted' });
});

// @desc    Toggle favorite
// @route   PUT /api/documents/:id/favorite
// @access  Private (viewer+)
const toggleFavorite = asyncHandler(async (req, res) => {
  const doc = req.document;
  const userId = req.user._id.toString();
  const idx = doc.favoritedBy.findIndex((u) => u.toString() === userId);

  if (idx > -1) {
    doc.favoritedBy.splice(idx, 1);
  } else {
    doc.favoritedBy.push(req.user._id);
  }

  await doc.save();

  res.status(200).json({ success: true, isFavorite: idx === -1 });
});

// @desc    Duplicate document
// @route   POST /api/documents/:id/duplicate
// @access  Private (viewer+)
const duplicateDocument = asyncHandler(async (req, res) => {
  const original = req.document;
  const copy = await Document.create({
    title: `${original.title} (Copy)`,
    content: original.content,
    owner: req.user._id,
  });

  await logActivity({ user: req.user._id, document: copy._id, type: 'document_created' });

  res.status(201).json({ success: true, document: serializeDoc(copy, req.user._id) });
});

// @desc    Update sharing settings (enable/disable link, set role)
// @route   PUT /api/documents/:id/share-settings
// @access  Private (owner)
const updateShareSettings = asyncHandler(async (req, res) => {
  const { shareEnabled, shareRole } = req.body;
  const doc = req.document;

  if (typeof shareEnabled === 'boolean') doc.shareEnabled = shareEnabled;
  if (shareRole && ['editor', 'viewer'].includes(shareRole)) doc.shareRole = shareRole;

  await doc.save();

  await logActivity({ user: req.user._id, document: doc._id, type: 'document_shared' });

  res.status(200).json({ success: true, document: serializeDoc(doc, req.user._id) });
});

// @desc    Add collaborator by email
// @route   POST /api/documents/:id/collaborators
// @access  Private (owner)
const addCollaborator = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const doc = req.document;

  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user) {
    return res.status(404).json({ success: false, message: 'No user found with that email' });
  }

  if (user._id.toString() === doc.owner.toString()) {
    return res.status(400).json({ success: false, message: 'User is already the owner' });
  }

  const existing = doc.collaborators.find((c) => c.user.toString() === user._id.toString());
  if (existing) {
    existing.role = role || existing.role;
  } else {
    doc.collaborators.push({ user: user._id, role: role || 'viewer' });
  }

  await doc.save();

  await Notification.create({
    recipient: user._id,
    sender: req.user._id,
    document: doc._id,
    type: 'document_shared',
    message: `${req.user.name} shared "${doc.title}" with you`,
  });

  await logActivity({ user: req.user._id, document: doc._id, type: 'document_shared', meta: { email } });

  const populated = await Document.findById(doc._id)
    .populate('owner', populateFields)
    .populate('collaborators.user', populateFields);

  res.status(200).json({ success: true, document: serializeDoc(populated, req.user._id) });
});

// @desc    Remove collaborator
// @route   DELETE /api/documents/:id/collaborators/:userId
// @access  Private (owner)
const removeCollaborator = asyncHandler(async (req, res) => {
  const doc = req.document;
  doc.collaborators = doc.collaborators.filter((c) => c.user.toString() !== req.params.userId);
  await doc.save();

  await logActivity({ user: req.user._id, document: doc._id, type: 'document_share_revoked' });

  res.status(200).json({ success: true, message: 'Collaborator removed' });
});

// @desc    Get document by share token (public link access)
// @route   GET /api/documents/shared/:token
// @access  Private (must be logged in)
const getDocumentByShareToken = asyncHandler(async (req, res) => {
  const doc = await Document.findOne({ shareToken: req.params.token, shareEnabled: true })
    .populate('owner', populateFields);

  if (!doc) {
    return res.status(404).json({ success: false, message: 'Shared link is invalid or has been disabled' });
  }

  const userId = req.user._id.toString();
  const isOwner = doc.owner._id.toString() === userId;
  const isCollaborator = doc.collaborators.some((c) => c.user.toString() === userId);

  // Auto-join as collaborator via link if not already owner/collaborator
  if (!isOwner && !isCollaborator) {
    doc.collaborators.push({ user: req.user._id, role: doc.shareRole });
    await doc.save();
  }

  res.status(200).json({ success: true, document: serializeDoc(doc, req.user._id) });
});

module.exports = {
  createDocument,
  getDocuments,
  getRecentDocuments,
  getTrash,
  getDocument,
  updateDocument,
  trashDocument,
  restoreDocument,
  permanentlyDeleteDocument,
  toggleFavorite,
  duplicateDocument,
  updateShareSettings,
  addCollaborator,
  removeCollaborator,
  getDocumentByShareToken,
  serializeDoc,
};
