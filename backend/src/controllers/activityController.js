const Activity = require('../models/Activity');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get activity feed for current user (their own actions across all docs)
// @route   GET /api/activity
// @access  Private
const getMyActivity = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '30', 10);

  const activities = await Activity.find({ user: req.user._id })
    .populate('document', 'title')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Activity.countDocuments({ user: req.user._id });

  res.status(200).json({
    success: true,
    activities,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Get activity log for a specific document (any user with access)
// @route   GET /api/documents/:id/activity
// @access  Private (viewer+)
const getDocumentActivity = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ document: req.document._id })
    .populate('user', 'name email avatarColor')
    .sort({ createdAt: -1 })
    .limit(100);

  res.status(200).json({ success: true, activities });
});

module.exports = { getMyActivity, getDocumentActivity };
