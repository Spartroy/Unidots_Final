import express from 'express';
const router = express.Router();
import {
  createClaim,
  getClaims,
  getClaimById,
  updateClaim,
  updateClaimStatus,
  assignClaim,
  addComment,
  attachFilesToClaim,
  getRecentClaims,
} from '../controllers/claimController.js';
import { protect, client, staff, manager } from '../middleware/authMiddleware.js';

// Client routes
router.route('/')
  .post(protect, client, createClaim)
  .get(protect, getClaims);

router.route('/recent')
  .get(protect, manager, getRecentClaims);

router.route('/:id')
  .get(protect, getClaimById)
  .put(protect, updateClaim);

// Comment routes
router.route('/:id/comments')
  .post(protect, addComment);

// Staff routes
router.route('/:id/status')
  .put(protect, staff, updateClaimStatus);

// File attachment routes - accessible to both clients and staff
router.route('/:id/attach-files')
  .put(protect, attachFilesToClaim);

// Manager routes
router.route('/:id/assign')
  .put(protect, manager, assignClaim);

export default router;