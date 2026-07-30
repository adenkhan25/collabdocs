const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: 'Untitled Document',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    label: {
      type: String,
      default: '',
    },
    wordCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

versionSchema.index({ document: 1, createdAt: -1 });

module.exports = mongoose.model('Version', versionSchema);
