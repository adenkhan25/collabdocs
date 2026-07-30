const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const collaboratorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['editor', 'viewer'], default: 'viewer' },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled Document',
      maxlength: 200,
    },
    content: {
      type: String,
      default: '',
    },
    yjsState: {
      type: Buffer,
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: [collaboratorSchema],
    isFavorite: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    favoritedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isTrashed: {
      type: Boolean,
      default: false,
    },
    trashedAt: {
      type: Date,
      default: null,
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
      default: () => nanoid(12),
    },
    shareEnabled: {
      type: Boolean,
      default: false,
    },
    shareRole: {
      type: String,
      enum: ['editor', 'viewer'],
      default: 'viewer',
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    coverEmoji: {
      type: String,
      default: '📄',
    },
  },
  { timestamps: true }
);

documentSchema.index({ title: 'text' });
documentSchema.index({ owner: 1, isTrashed: 1 });
documentSchema.index({ 'collaborators.user': 1 });

documentSchema.methods.getUserRole = function (userId) {
  const uid = userId.toString();
  if (this.owner.toString() === uid) return 'owner';
  const collab = this.collaborators.find((c) => c.user.toString() === uid);
  return collab ? collab.role : null;
};

module.exports = mongoose.model('Document', documentSchema);
