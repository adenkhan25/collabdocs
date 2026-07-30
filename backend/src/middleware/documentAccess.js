const Document = require('../models/Document');
const asyncHandler = require('./asyncHandler');

// Loads document by :id param, verifies the requesting user has at least viewer access,
// attaches `req.document` and `req.userRole` ('owner' | 'editor' | 'viewer').
const requireDocAccess = (minRole = 'viewer') =>
  asyncHandler(async (req, res, next) => {
    const doc = await Document.findById(req.params.id);

    if (!doc || doc.isTrashed) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const role = doc.getUserRole(req.user._id);

    if (!role) {
      return res.status(403).json({ success: false, message: 'You do not have access to this document' });
    }

    const rank = { viewer: 1, editor: 2, owner: 3 };

    if (rank[role] < rank[minRole]) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions for this action' });
    }

    req.document = doc;
    req.userRole = role;
    next();
  });

module.exports = { requireDocAccess };
