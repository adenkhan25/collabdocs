const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadImage } = require('../controllers/uploadController');

router.post('/image', protect, upload.single('image'), uploadImage);

module.exports = router;
