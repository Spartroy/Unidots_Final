import asyncHandler from 'express-async-handler';
import ContactMessage from '../models/contactMessageModel.js';
import User from '../models/userModel.js';
import { createSystemNotification } from './notificationController.js';

// Very small in-memory rate limit: 5 messages per IP per hour (resets on server restart).
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

const rateLimited = (ip) => {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// @desc    Send a message from the public website
// @route   POST /api/contact
// @access  Public
export const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, phone, message, website, language } = req.body || {};

  // Honeypot: real visitors never fill the hidden "website" field. Pretend success to bots.
  if (website) return res.status(201).json({ ok: true });

  // Behind a proxy (Render, Vercel) req.ip is the proxy, so prefer the forwarded client address.
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown';
  if (rateLimited(String(ip))) {
    res.status(429);
    throw new Error('Too many messages. Please try again later.');
  }

  if (!name || !String(name).trim() || !email || !message || !String(message).trim()) {
    res.status(400);
    throw new Error('Name, email and message are required.');
  }
  if (!EMAIL_RE.test(String(email).trim())) {
    res.status(400);
    throw new Error('Please enter a valid email address.');
  }

  const saved = await ContactMessage.create({
    name: String(name).slice(0, 120),
    email: String(email).slice(0, 200),
    phone: phone ? String(phone).slice(0, 40) : undefined,
    message: String(message).slice(0, 4000),
    language: language === 'ar' ? 'ar' : 'en',
    ip: String(ip),
  });

  // Tell every active manager/admin (in-app notification)
  try {
    const managers = await User.find({ role: { $in: ['manager', 'admin'] }, isActive: true }).select('_id');
    await Promise.all(
      managers.map((m) =>
        createSystemNotification(
          m._id,
          'New website message',
          `${saved.name} sent a message from the website.`,
          'system',
          saved._id,
          'info',
          '/manager/messages'
        )
      )
    );
  } catch (err) {
    console.error('Contact notification failed:', err.message);
  }

  res.status(201).json({ ok: true });
});

// @desc    List website messages
// @route   GET /api/contact
// @access  Manager
export const getContactMessages = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status === 'new' || req.query.status === 'handled') filter.status = req.query.status;
  const messages = await ContactMessage.find(filter).sort({ createdAt: -1 }).limit(200).select('-ip');
  res.json(messages);
});

// @desc    Mark a message handled / new again
// @route   PUT /api/contact/:id
// @access  Manager
export const updateContactMessage = asyncHandler(async (req, res) => {
  const msg = await ContactMessage.findById(req.params.id);
  if (!msg) {
    res.status(404);
    throw new Error('Message not found');
  }
  const status = req.body.status === 'new' ? 'new' : 'handled';
  msg.status = status;
  msg.handledBy = status === 'handled' ? req.user._id : undefined;
  msg.handledAt = status === 'handled' ? new Date() : undefined;
  await msg.save();
  res.json(msg);
});
