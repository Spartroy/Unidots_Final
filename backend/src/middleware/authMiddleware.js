import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

// Protect routes - verify token
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      // Check if user is active
      if (!req.user.isActive) {
        res.status(401);
        throw new Error('Account is inactive. Please contact support.');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, please login');
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role ${req.user.role} is not authorized to access this resource`);
    }
    next();
  };
};

// Client only middleware
const client = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'client') {
    res.status(403);
    throw new Error('Only clients can access this resource');
  }
  next();
});

// Employee only middleware
const employee = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'employee') {
    res.status(403);
    throw new Error('Only employees can access this resource');
  }
  next();
});

// Manager only middleware
const manager = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only managers can access this resource');
  }
  next();
});

// Middleware for prepress department access
const prepress = (req, res, next) => {
  if (req.user && (req.user.department === 'prepress' || req.user.role === 'manager' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied. Only prepress, managers, or admins can access this resource.');
  }
};

// Middleware for prepress or manager access
const prepressOrManager = (req, res, next) => {
  if (req.user && (req.user.department === 'prepress' || req.user.role === 'manager' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied. Only prepress staff, managers, or admins can access this resource.');
  }
};

// Courier-only middleware
const courier = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'courier') {
    res.status(403);
    throw new Error('Only couriers can access this resource');
  }
  next();
});

// Staff middleware (employee or manager)
const staff = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'employee' && req.user.role !== 'manager' && req.user.role !== 'admin' && req.user.role !== 'prepress') {
    res.status(403);
    throw new Error('Only staff members can access this resource');
  }
  next();
});

export { protect, authorize, client, employee, manager, staff, prepress, prepressOrManager, courier };