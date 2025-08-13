import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Task from '../models/taskModel.js';
import Order from '../models/orderModel.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      phone: user.phone,
      address: user.address,
      geoLocation: user.geoLocation,
      department: user.department,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      defaultDesigner: user.defaultDesigner,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    // Fields that any user can update
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    
    // Address update if provided
    if (req.body.address) {
      // Ensure we're handling address as an object for client users
      if (user.role === 'client') {
        // Convert from string address if needed
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
        
        // Update with new values
        user.address = {
          ...user.address,
          ...req.body.address,
        };
      } else {
        // For non-client users, update address normally
        user.address = req.body.address;
      }
    } else if (user.role === 'client' && (typeof user.address === 'string' || !user.address)) {
      // Ensure client address is properly structured even if not updating
      const oldAddress = user.address || '';
      user.address = {
        street: oldAddress,
        city: '',
        state: '',
        postalCode: '',
        country: ''
      };
    }

    // GeoLocation update if provided
    if (req.body.geoLocation) {
      const { latitude, longitude } = req.body.geoLocation;
      user.geoLocation = {
        latitude: latitude !== undefined ? latitude : user.geoLocation?.latitude,
        longitude: longitude !== undefined ? longitude : user.geoLocation?.longitude,
      };
    }

    // Update password if provided
    if (req.body.password) {
      user.password = req.body.password;
    }

    // Client-specific fields
    if (user.role === 'client') {
      user.company = req.body.company || user.company;
      // Allow client to set default designer (must be an employee)
      if (req.body.defaultDesigner) {
        try {
          const designer = await User.findById(req.body.defaultDesigner);
          if (designer && designer.role === 'employee') {
            user.defaultDesigner = designer._id;
          } else {
            throw new Error('Invalid default designer');
          }
        } catch (e) {
          res.status(400);
          throw new Error('Invalid default designer');
        }
      }
      if (req.body.defaultDesigner === null) {
        user.defaultDesigner = undefined;
      }
    }

    // Save updated user
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      company: updatedUser.company,
      phone: updatedUser.phone,
      address: updatedUser.address,
      geoLocation: updatedUser.geoLocation,
      department: updatedUser.department,
      defaultDesigner: updatedUser.defaultDesigner,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user password
// @route   PUT /api/users/profile/password
// @access  Private
const updateUserPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Please provide current and new password');
  }
  
  // Make sure to include password field with .select('+password')
  const user = await User.findById(req.user.id).select('+password');
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Check if current password matches
  const isMatch = await user.matchPassword(currentPassword);
  
  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  res.status(200).json({ message: 'Password updated successfully' });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin/Manager
const getUsers = asyncHandler(async (req, res) => {
  // Only managers and admins can view all users
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view all users');
  }

  let query = {};

  // Filter by role if provided
  if (req.query.role) {
    query.role = req.query.role;
  }

  // Filter by department if provided
  if (req.query.department) {
    query.department = req.query.department;
  }

  // Filter by isActive status if provided
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  // Search by name or email
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Get total count for pagination
  const total = await User.countDocuments(query);

  // Add status field based on isActive for consistent filtering
  const usersWithStatus = users.map(user => {
    const userObj = user.toObject();
    userObj.status = userObj.isActive ? 'active' : 'inactive';
    return userObj;
  });

  res.json({
    users: usersWithStatus,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
});

// @desc    Public list of employees (for clients to choose preferred designer)
// @route   GET /api/users/public/employees
// @access  Private (any authenticated user)
const getEmployeesPublic = asyncHandler(async (req, res) => {
  const query = { role: 'employee', isActive: true };
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  const employees = await User.find(query)
    .select('_id name email department')
    .sort({ name: 1 });
  res.json({ users: employees });
});

const getUserById = asyncHandler(async (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view user details');
  }

  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    // Add status field based on isActive
    const userObj = user.toObject();
    userObj.status = userObj.isActive ? 'active' : 'inactive';
    
    // If the user is an employee, fetch their assigned tasks and orders
    if (user.role === 'employee') {
      const tasks = await Task.find({ assignedTo: user._id })
        .populate('relatedOrder', 'orderNumber title')
        .sort({ createdAt: -1 });
      
      // Fetch orders assigned to the employee
      const orders = await Order.find({ assignedTo: user._id })
        .populate('client', 'name company')
        .sort({ createdAt: -1 });
      
      // Add tasks and orders to the user object
      userObj.tasks = tasks;
      userObj.orders = orders;
      res.json(userObj);
    } else {
      res.json(userObj);
    }
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


const updateUser = asyncHandler(async (req, res) => {
  // Only managers and admins can update users
  if (req.user.role !== 'manager') {
    res.status(403);
    throw new Error('Not authorized to update users');
  }

  const user = await User.findById(req.params.id);

  if (user) {
    // Update fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;
    user.phone = req.body.phone || user.phone;
    
    // Handle address updates
    if (req.body.address) {
      // Ensure we're handling address as an object for client users
      if (user.role === 'client') {
        // Convert from string address if needed
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
        
        // Update with new values
        user.address = {
          ...user.address,
          ...req.body.address,
        };
      } else {
        // For non-client users, update address normally
        user.address = req.body.address;
      }
    } else if (user.role === 'client' && (typeof user.address === 'string' || !user.address)) {
      // Ensure client address is properly structured even if not updating
      const oldAddress = user.address || '';
      user.address = {
        street: oldAddress,
        city: '',
        state: '',
        postalCode: '',
        country: ''
      };
    }
    
    // Role-specific fields
    if (user.role === 'client') {
      user.company = req.body.company || user.company;
    }
    
    if (user.role === 'employee' || user.role === 'manager') {
      user.department = req.body.department || user.department;
    }

    // Update password if provided
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      company: updatedUser.company,
      phone: updatedUser.phone,
      address: updatedUser.address,
      department: updatedUser.department,
      isActive: updatedUser.isActive,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


const deleteUser = asyncHandler(async (req, res) => {
  // Only admins can delete users
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete users');
  }

  const user = await User.findById(req.params.id);

  if (user) {
    // Instead of deleting, set as inactive
    user.isActive = false;
    await user.save();
    
    res.json({ message: 'User deactivated' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Create new employee
// @route   POST /api/users/employees
// @access  Private/Manager
const createEmployee = asyncHandler(async (req, res) => {
  // Only managers and admins can create employees
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to create employees');
  }

  const { name, email, password, department, phone } = req.body;

  // Validation
  if (!name || !email || !password || !department) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: 'employee',
    department,
    phone,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Create new courier
// @route   POST /api/users/couriers
// @access  Private/Manager
const createCourier = asyncHandler(async (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to create couriers');
  }
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all required fields');
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }
  const user = await User.create({
    name,
    email,
    password,
    role: 'courier',
    department: 'none',
    phone,
  });
  if (user) {
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});


const updateUserStatus = asyncHandler(async (req, res) => {
  // Only managers and admins can update user status
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update user status');
  }

  const { status } = req.body;
  if (!status || !['active', 'inactive'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status. Must be "active" or "inactive"');
  }

  const user = await User.findById(req.params.id);

  if (user) {
    // Convert status to isActive boolean
    user.isActive = status === 'active';
    
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.isActive ? 'active' : 'inactive'
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get dashboard stats
// @route   GET /api/users/dashboard-stats
// @access  Private/Admin/Manager
const getDashboardStats = asyncHandler(async (req, res) => {
  // Only managers and admins can view dashboard stats
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view dashboard stats');
  }

  // Get total users by role
  const totalEmployees = await User.countDocuments({ role: 'employee' });
  const totalClients = await User.countDocuments({ role: 'client' });
  
  // Get order stats
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ 
    status: { $in: ['Submitted', 'Designing', 'In Prepress'] } 
  });
  const completedOrders = await Order.countDocuments({ status: 'Completed' });
  
  // Get detailed order status counts
  const orderStatusAggregation = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const ordersByStatus = {};
  orderStatusAggregation.forEach(item => {
    ordersByStatus[item._id] = item.count;
  });
  
  // Get monthly order trends for the last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  
  const monthlyTrends = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: twelveMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
  
  // Get task stats
  const totalTasks = await Task.countDocuments();
  const pendingTasks = await Task.countDocuments({ status: 'pending' });
  const completedTasks = await Task.countDocuments({ status: 'completed' });
  
  // Get overdue tasks
  const now = new Date();
  const overdueTasks = await Task.countDocuments({
    status: { $ne: 'completed' },
    dueDate: { $lt: now }
  });
  
  res.json({
    totalEmployees,
    totalClients,
    totalOrders,
    pendingOrders,
    completedOrders,
    totalTasks,
    pendingTasks,
    completedTasks,
    overdueTasks,
    ordersByStatus,
    monthlyOrderTrends: monthlyTrends
  });
});

export {
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  createEmployee,
  createCourier,
  updateUserStatus,
  getDashboardStats,
  getEmployeesPublic
};