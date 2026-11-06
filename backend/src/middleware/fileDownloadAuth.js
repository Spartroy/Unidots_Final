import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import { protect } from './authMiddleware.js';
import { verifyFileToken } from '../services/fileAccess.js';

// Downloads accept either the normal Authorization header or a short-lived signed link (?token=...)
// so a plain browser download still proves who is asking. Anonymous downloads are refused.
export const fileDownloadAuth = asyncHandler(async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  const uid = verifyFileToken(req.query.token, req.params.id);
  const user = uid ? await User.findById(uid).select('-password') : null;
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('Sign in to download this file');
  }
  req.user = user;
  next();
});
