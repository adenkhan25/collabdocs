const Activity = require('../models/Activity');

const logActivity = async ({ user, document = null, type, meta = {} }) => {
  try {
    await Activity.create({ user, document, type, meta });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};

module.exports = logActivity;
