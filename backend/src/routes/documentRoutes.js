const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireDocAccess } = require('../middleware/documentAccess');

const {
  createDocument,
  getDocuments,
  getRecentDocuments,
  getTrash,
  getDocument,
  updateDocument,
  trashDocument,
  restoreDocument,
  permanentlyDeleteDocument,
  toggleFavorite,
  duplicateDocument,
  updateShareSettings,
  addCollaborator,
  removeCollaborator,
  getDocumentByShareToken,
} = require('../controllers/documentController');

const {
  createVersion,
  getVersions,
  getVersion,
  restoreVersion,
} = require('../controllers/versionController');

const {
  getComments,
  createComment,
  addReply,
  toggleResolveComment,
  deleteComment,
} = require('../controllers/commentController');

const { getDocumentActivity } = require('../controllers/activityController');
const { exportPDF, exportDOCX, exportHTML } = require('../controllers/exportController');

router.use(protect);

router.post('/', createDocument);
router.get('/', getDocuments);
router.get('/recent', getRecentDocuments);
router.get('/trash', getTrash);
router.get('/shared/:token', getDocumentByShareToken);

router.get('/:id', requireDocAccess('viewer'), getDocument);
router.put('/:id', requireDocAccess('editor'), updateDocument);
router.delete('/:id', requireDocAccess('owner'), trashDocument);
router.put('/:id/restore', restoreDocument);
router.delete('/:id/permanent', permanentlyDeleteDocument);
router.put('/:id/favorite', requireDocAccess('viewer'), toggleFavorite);
router.post('/:id/duplicate', requireDocAccess('viewer'), duplicateDocument);

router.put('/:id/share-settings', requireDocAccess('owner'), updateShareSettings);
router.post('/:id/collaborators', requireDocAccess('owner'), addCollaborator);
router.delete('/:id/collaborators/:userId', requireDocAccess('owner'), removeCollaborator);

router.post('/:id/versions', requireDocAccess('editor'), createVersion);
router.get('/:id/versions', requireDocAccess('viewer'), getVersions);
router.get('/:id/versions/:versionId', requireDocAccess('viewer'), getVersion);
router.put('/:id/versions/:versionId/restore', requireDocAccess('editor'), restoreVersion);

router.get('/:id/comments', requireDocAccess('viewer'), getComments);
router.post('/:id/comments', requireDocAccess('viewer'), createComment);
router.post('/:id/comments/:commentId/replies', requireDocAccess('viewer'), addReply);
router.put('/:id/comments/:commentId/resolve', requireDocAccess('viewer'), toggleResolveComment);
router.delete('/:id/comments/:commentId', requireDocAccess('viewer'), deleteComment);

router.get('/:id/activity', requireDocAccess('viewer'), getDocumentActivity);

router.get('/:id/export/pdf', requireDocAccess('viewer'), exportPDF);
router.get('/:id/export/docx', requireDocAccess('viewer'), exportDOCX);
router.get('/:id/export/html', requireDocAccess('viewer'), exportHTML);

module.exports = router;
