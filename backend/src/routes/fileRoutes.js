import express from 'express';
const router = express.Router();
import {
  uploadFile,
  getFiles,
  getFileById,
  updateFile,
  deleteFile,
  downloadFile,
  uploadMultipleFiles,
} from '../controllers/fileController.js';
import { protect } from '../middleware/authMiddleware.js';

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

// Download file route - no auth required to allow direct browser downloads
router.route('/:id/download')
  .get(downloadFile);

export default router;