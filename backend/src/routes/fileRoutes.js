import express from 'express';
const router = express.Router();
import {
  uploadFile,
  getFiles,
  getFileById,
  updateFile,
  deleteFile,
  downloadFile,
  getFileLink,
  uploadMultipleFiles,
} from '../controllers/fileController.js';
import { protect } from '../middleware/authMiddleware.js';
import { fileDownloadAuth } from '../middleware/fileDownloadAuth.js';

// All authenticated users can upload and view files
router.route('/')
  .post(protect, uploadFile)
  .get(protect, getFiles);

// Multiple files upload route
router.route('/upload')
  .post(protect, uploadMultipleFiles);

router.route('/:id')
  .get(protect, getFileById)
  .put(protect, updateFile)
  .delete(protect, deleteFile);

// Short-lived signed link for plain browser downloads
router.route('/:id/link')
  .get(protect, getFileLink);

// Download: signed-in users only (header or signed link)
router.route('/:id/download')
  .get(fileDownloadAuth, downloadFile);

export default router;