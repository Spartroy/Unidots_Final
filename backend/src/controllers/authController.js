import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public for clients, Private for employees/managers
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, company, phone, address, department } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Handle different registration types based on role
  const requestedRole = role || 'client'; // Default to client if not specified

  // Role validation - only managers/admins can create employees and managers
  if ((requestedRole === 'employee' || requestedRole === 'manager')) {
    // Check if we have a logged-in user with proper permissions
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      // No token provided for employee/manager registration
      res.status(403);
      throw new Error('Manager authorization required to create employee or manager accounts');
    }
    
    try {
      // Verify the token and get the user
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const adminUser = await User.findById(decoded.id);
      
      // Check if admin user has proper role
      if (!adminUser || (adminUser.role !== 'manager' && adminUser.role !== 'admin')) {
        res.status(403);
        throw new Error('Only managers or admins can create employee or manager accounts');
      }
    } catch (error) {
      res.status(401);
      throw new Error('Invalid or expired token');
    }
  }

  // Additional validation for client role
  if (requestedRole === 'client' && !company) {
    res.status(400);
    throw new Error('Company name is required for client accounts');
  }

  // Additional validation for employee/manager role
  if ((requestedRole === 'employee' || requestedRole === 'manager') && !department) {
    res.status(400);
    throw new Error('Department is required for employee and manager accounts');
  }

  // Auto-assign department based on role if not provided
  let assignedDepartment = department || 'none';
  if (requestedRole === 'employee' && !department) {
    assignedDepartment = 'design';
  } else if (requestedRole === 'prepress' && !department) {
    assignedDepartment = 'prepress';
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: requestedRole,
    company,
    phone,
    address,
    department: assignedDepartment,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      department: user.department,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    res.status(401);
    throw new Error('Account is inactive. Please contact support.');
  }

  // Migrate old client data if needed
  if (user.role === 'client') {
    // Handle old string address format
    if (typeof user.address === 'string' || !user.address) {
      const oldAddress = user.address || '';
      user.address = {
        street: oldAddress,
        city: '',
        state: '',
        postalCode: '',
        country: ''
      };
    }
    
    // Ensure phone exists
    if (!user.phone) {
      user.phone = '';
    }
  }

  // Update last login
  user.lastLogin = Date.now();
  
  try {
    await user.save();
  } catch (error) {
    console.error('Error updating user login time:', error);
    // Continue with login even if save fails - we don't want to block login
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company,
    phone: user.phone,
    address: user.address,
    department: user.department,
    token: generateToken(user._id),
  });
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export {
  registerUser,
  loginUser,
}; 