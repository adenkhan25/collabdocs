const asyncHandler = require('../middleware/asyncHandler');

// @desc    Upload an image (used by the editor's image insertion tool)
// @route   POST /api/upload/image
// @access  Private
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  res.status(200).json({ success: true, url: fileUrl });
});

module.exports = { uploadImage };
