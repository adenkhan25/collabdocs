const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');
const logActivity = require('../utils/logActivity');

const populateFields = 'name email avatarColor';

// @desc    Get all comments for a document
// @route   GET /api/documents/:id/comments
// @access  Private (viewer+)
const getComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ document: req.document._id })
    .populate('author', populateFields)
    .populate('replies.author', populateFields)
    .populate('resolvedBy', populateFields)
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, comments });
});

// @desc    Create a comment on a highlighted range
// @route   POST /api/documents/:id/comments
// @access  Private (viewer+, viewers can comment)
const createComment = asyncHandler(async (req, res) => {
  const { text, highlightedText, rangeFrom, rangeTo } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Comment text is required' });
  }

  const comment = await Comment.create({
    document: req.document._id,
    author: req.user._id,
    text: text.trim(),
    highlightedText: highlightedText || '',
    rangeFrom: rangeFrom ?? null,
    rangeTo: rangeTo ?? null,
  });

  const populated = await comment.populate('author', populateFields);

  const doc = req.document;
  const recipients = new Set([doc.owner.toString(), ...doc.collaborators.map((c) => c.user.toString())]);
  recipients.delete(req.user._id.toString());

  await Promise.all(
    Array.from(recipients).map((uid) =>
      Notification.create({
        recipient: uid,
        sender: req.user._id,
        document: doc._id,
        type: 'comment_added',
        message: `${req.user.name} commented on "${doc.title}"`,
      })
    )
  );

  await logActivity({ user: req.user._id, document: doc._id, type: 'comment_added' });

  res.status(201).json({ success: true, comment: populated });
});

// @desc    Reply to a comment
// @route   POST /api/documents/:id/comments/:commentId/replies
// @access  Private (viewer+)
const addReply = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Reply text is required' });
  }

  const comment = await Comment.findOne({ _id: req.params.commentId, document: req.document._id });
  if (!comment) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }

  comment.replies.push({ author: req.user._id, text: text.trim() });
  await comment.save();

  const populated = await comment.populate([
    { path: 'author', select: populateFields },
    { path: 'replies.author', select: populateFields },
  ]);

  if (comment.author.toString() !== req.user._id.toString()) {
    await Notification.create({
      recipient: comment.author,
      sender: req.user._id,
      document: req.document._id,
      type: 'comment_reply',
      message: `${req.user.name} replied to your comment`,
    });
  }

  res.status(201).json({ success: true, comment: populated });
});

// @desc    Resolve / unresolve a comment
// @route   PUT /api/documents/:id/comments/:commentId/resolve
// @access  Private (viewer+)
const toggleResolveComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findOne({ _id: req.params.commentId, document: req.document._id });
  if (!comment) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }

  comment.resolved = !comment.resolved;
  comment.resolvedBy = comment.resolved ? req.user._id : null;
  comment.resolvedAt = comment.resolved ? new Date() : null;
  await comment.save();

  if (comment.resolved) {
    await logActivity({ user: req.user._id, document: req.document._id, type: 'comment_resolved' });
  }

  res.status(200).json({ success: true, comment });
});

// @desc    Delete own comment
// @route   DELETE /api/documents/:id/comments/:commentId
// @access  Private (author only, or doc owner)
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findOne({ _id: req.params.commentId, document: req.document._id });
  if (!comment) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }

  const isAuthor = comment.author.toString() === req.user._id.toString();
  const isDocOwner = req.document.owner.toString() === req.user._id.toString();

  if (!isAuthor && !isDocOwner) {
    return res.status(403).json({ success: false, message: 'You can only delete your own comments' });
  }

  await comment.deleteOne();

  await logActivity({ user: req.user._id, document: req.document._id, type: 'comment_deleted' });

  res.status(200).json({ success: true, message: 'Comment deleted' });
});

module.exports = { getComments, createComment, addReply, toggleResolveComment, deleteComment };
