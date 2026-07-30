const Version = require('../models/Version');
const asyncHandler = require('../middleware/asyncHandler');
const logActivity = require('../utils/logActivity');

const countWords = (html = '') => {
  const text = html.replace(/<[^>]*>/g, ' ').trim();
  return text ? text.split(/\s+/).length : 0;
};

// @desc    Save a new version snapshot of the document
// @route   POST /api/documents/:id/versions
// @access  Private (editor+)
const createVersion = asyncHandler(async (req, res) => {
  const doc = req.document;
  const { label } = req.body;

  const version = await Version.create({
    document: doc._id,
    content: doc.content,
    title: doc.title,
    createdBy: req.user._id,
    label: label || '',
    wordCount: countWords(doc.content),
  });

  res.status(201).json({ success: true, version });
});

// @desc    Get version history for a document
// @route   GET /api/documents/:id/versions
// @access  Private (viewer+)
const getVersions = asyncHandler(async (req, res) => {
  const versions = await Version.find({ document: req.document._id })
    .populate('createdBy', 'name email avatarColor')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, versions });
});

// @desc    Get single version content
// @route   GET /api/documents/:id/versions/:versionId
// @access  Private (viewer+)
const getVersion = asyncHandler(async (req, res) => {
  const version = await Version.findOne({ _id: req.params.versionId, document: req.document._id });
  if (!version) {
    return res.status(404).json({ success: false, message: 'Version not found' });
  }
  res.status(200).json({ success: true, version });
});

// @desc    Restore a version as the current document content
// @route   PUT /api/documents/:id/versions/:versionId/restore
// @access  Private (editor+)
const restoreVersion = asyncHandler(async (req, res) => {
  const version = await Version.findOne({ _id: req.params.versionId, document: req.document._id });
  if (!version) {
    return res.status(404).json({ success: false, message: 'Version not found' });
  }

  const doc = req.document;

  // Save current state as a version before restoring, so nothing is lost
  await Version.create({
    document: doc._id,
    content: doc.content,
    title: doc.title,
    createdBy: req.user._id,
    label: 'Before restore',
    wordCount: countWords(doc.content),
  });

  doc.content = version.content;
  doc.title = version.title;
  doc.lastEditedBy = req.user._id;
  await doc.save();

  await logActivity({ user: req.user._id, document: doc._id, type: 'version_restored' });

  res.status(200).json({ success: true, document: doc });
});

module.exports = { createVersion, getVersions, getVersion, restoreVersion };
