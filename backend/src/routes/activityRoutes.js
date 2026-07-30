const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyActivity } = require('../controllers/activityController');

router.use(protect);
router.get('/', getMyActivity);

module.exports = router;
