import { rateLimit } from 'express-rate-limit';

const json429 = (message) => (req, res) => res.status(429).json({ message });

// 10 failed sign-ins per 15 minutes per address (successful logins are not counted).
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: json429('Too many sign-in attempts. Please wait 15 minutes and try again.'),
});

// Public registration: 20 per hour per address.
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: json429('Too many sign-up attempts. Please try again later.'),
});

// Browser error reports: 30 per minute per address.
export const clientErrorLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => res.status(204).end(),
});
