const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    type: {
      type: String,
      enum: [
        'user_login',
        'user_logout',
        'user_register',
        'document_created',
        'document_edited',
        'document_renamed',
        'document_deleted',
        'document_restored',
        'document_permanently_deleted',
        'document_shared',
        'document_share_revoked',
        'comment_added',
        'comment_resolved',
        'comment_deleted',
        'version_restored',
        'password_changed',
      ],
      required: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ document: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
