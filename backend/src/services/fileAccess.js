import jwt from 'jsonwebtoken';
import Order from '../models/orderModel.js';
import Claim from '../models/claimModel.js';
import Task from '../models/taskModel.js';
import { canViewOrder, isManager } from '../utils/orderVisibility.js';

const same = (a, b) => a && b && String(a._id || a) === String(b._id || b);

/** May this user open this file? Managers always; the uploader; otherwise whoever may see the order, claim or task it belongs to. */
export const canAccessFile = async (user, file) => {
  if (!user || !file) return false;
  if (isManager(user)) return true;
  if (same(file.uploadedBy, user._id)) return true;

  if (file.relatedOrder) {
    const order = await Order.findById(file.relatedOrder._id || file.relatedOrder).select('client assignedTo status stages');
    if (order && canViewOrder(user, order)) return true;
  }
  if (file.relatedClaim) {
    const claim = await Claim.findById(file.relatedClaim._id || file.relatedClaim).select('client assignedTo');
    if (claim && (same(claim.client, user._id) || same(claim.assignedTo, user._id))) return true;
  }
  if (file.relatedTask) {
    const task = await Task.findById(file.relatedTask._id || file.relatedTask).select('assignedTo createdBy');
    if (task && (same(task.assignedTo, user._id) || same(task.createdBy, user._id))) return true;
  }
  return false;
};

// Short-lived link so a plain browser download (no Authorization header) still proves who asked.
export const signFileToken = (fileId, userId) => jwt.sign({ fid: String(fileId), uid: String(userId), t: 'file' }, process.env.JWT_SECRET, { expiresIn: '90s' });

export const verifyFileToken = (token, fileId) => {
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    return p.t === 'file' && p.fid === String(fileId) ? p.uid : null;
  } catch (_) {
    return null;
  }
};
