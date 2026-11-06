import express from 'express';
import { reportClientError } from '../controllers/clientErrorController.js';
import { clientErrorLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();
router.post('/', clientErrorLimiter, reportClientError);

export default router;
