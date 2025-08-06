import asyncHandler from 'express-async-handler';
import Task from '../models/taskModel.js';
import User from '../models/userModel.js';
import File from '../models/fileModel.js';
import { createSystemNotification } from './notificationController.js';

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private/Manager
const createTask = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    assignedTo,
    relatedOrder,
    dueDate,
    priority,
    taskType,
  } = req.body;

  // Validation
  if (!title || !description || !assignedTo) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if assigned user exists and is an employee
  const assignedUser = await User.findById(assignedTo);
  if (!assignedUser || assignedUser.role !== 'employee') {
    res.status(400);
    throw new Error('Invalid employee assignment');
  }

  // Create task
  const task = await Task.create({
    title,
    description,
    assignedTo,
    createdBy: req.user.id,
    relatedOrder: relatedOrder || null,
    dueDate: dueDate || null,
    priority: priority || 'Medium',
    taskType: taskType || 'General',
  });

  if (task) {
    // Create notification for the assigned employee
    await createSystemNotification(
      assignedTo,
      'New Task Assigned',
      `You have been assigned a new task: ${task.title}`,
      'task',
      task._id,
      'info',
      `/employee/tasks/${task._id}`
    );
    
    res.status(201).json(task);
  } else {
    res.status(400);
    throw new Error('Invalid task data');
  }
});

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  let query = {};

  // Filter tasks based on user role
  if (req.user.role === 'employee') {
    // Employees can only see tasks assigned to them
    query.assignedTo = req.user.id;
  } else if (req.user.role === 'manager' || req.user.role === 'admin') {
    // Managers can filter by assignedTo employee if provided
    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }
  }

  // Apply filters if provided
  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.priority) {
    query.priority = req.query.priority;
  }

  if (req.query.taskType) {
    query.taskType = req.query.taskType;
  }

  if (req.query.relatedOrder) {
    query.relatedOrder = req.query.relatedOrder;
  }

  // Date range filter
  if (req.query.startDate && req.query.endDate) {
    query.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  // Search by title
  if (req.query.search) {
    query.title = { $regex: req.query.search, $options: 'i' };
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('relatedOrder', 'orderNumber title')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Get total count for pagination
  const total = await Task.countDocuments(query);

  res.json({
    tasks,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
});

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('relatedOrder', 'orderNumber title status')
    .populate('comments.author', 'name email role');

  if (task) {
    // Check if user has permission to view this task
    if (
      req.user.role === 'employee' &&
      task.assignedTo._id.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error('Not authorized to view this task');
    }

    res.json(task);
  } else {
    res.status(404);
    throw new Error('Task not found');
  }
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('relatedOrder', 'client orderNumber title');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check permissions
  if (
    req.user.role === 'employee' &&
    task.assignedTo.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error('Not authorized to update this task');
  }

  // Update fields based on request body
  const updatedFields = {};
  const changedFields = [];
  
  // Fields that can be updated by employees
  if (req.user.role === 'employee') {
    if (req.body.notes) {
      updatedFields.notes = req.body.notes;
      changedFields.push('notes');
    }
    if (req.body.progress !== undefined) {
      updatedFields.progress = req.body.progress;
      changedFields.push('progress');
    }
    if (req.body.status) {
      updatedFields.status = req.body.status;
      changedFields.push('status');
    }
  } 
  // Fields that can be updated by managers
  else if (req.user.role === 'manager' || req.user.role === 'admin') {
    // Allow updating any field provided in the request
    Object.keys(req.body).forEach(key => {
      updatedFields[key] = req.body[key];
      changedFields.push(key);
    });
  }

  // Update the task
  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    updatedFields,
    { new: true, runValidators: true }
  )
  .populate('assignedTo', 'name email')
  .populate('createdBy', 'name email')
  .populate('relatedOrder', 'client orderNumber title');

  // Send notifications based on who updated the task and what was updated
  // 1. If employee updated the task, notify the task creator/manager
  if (req.user.role === 'employee' && changedFields.length > 0) {
    await createSystemNotification(
      task.createdBy._id.toString(),
      'Task Updated by Employee',
      `${req.user.name} has updated the task "${task.title}" (${changedFields.join(', ')})`,
      'task',
      task._id,
      'info',
      `/manager/tasks/${task._id}`
    );
    
    // Also notify all managers
    if (task.createdBy.role !== 'manager' && task.createdBy.role !== 'admin') {
      const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
      for (const manager of managers) {
        if (manager._id.toString() !== task.createdBy._id.toString()) {
          await createSystemNotification(
            manager._id,
            'Task Updated by Employee',
            `${req.user.name} has updated the task "${task.title}" (${changedFields.join(', ')})`,
            'task',
            task._id,
            'info',
            `/manager/tasks/${task._id}`
          );
        }
      }
    }
  }

  // 2. If manager updated the task, notify the assigned employee
  if ((req.user.role === 'manager' || req.user.role === 'admin') && 
      updatedTask.assignedTo && 
      req.user.id !== updatedTask.assignedTo._id.toString()) {
    await createSystemNotification(
      updatedTask.assignedTo._id.toString(),
      'Task Updated by Manager',
      `${req.user.name} has updated the task "${updatedTask.title}" (${changedFields.join(', ')})`,
      'task',
      updatedTask._id,
      'info',
      `/employee/tasks/${updatedTask._id}`
    );
  }

  // 3. If the task is related to an order, notify the client about status changes
  if (updatedTask.relatedOrder && updatedTask.relatedOrder.client && 
      changedFields.includes('status')) {
    await createSystemNotification(
      updatedTask.relatedOrder.client.toString(),
      'Task Status Update on Your Order',
      `A task for your order #${updatedTask.relatedOrder.orderNumber} has been updated to ${updatedTask.status}`,
      'order',
      updatedTask.relatedOrder._id,
      'info',
      `/client/orders/${updatedTask.relatedOrder._id}`
    );
  }

  res.json(updatedTask);
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Manager
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  await task.remove();

  res.json({ message: 'Task removed' });
});

// @desc    Complete task
// @route   PUT /api/tasks/:id/complete
// @access  Private/Employee
const completeTask = asyncHandler(async (req, res) => {
  const { completionNotes } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user is assigned to this task
  if (task.assignedTo.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to complete this task');
  }

  // Update task status
  task.status = 'Completed';
  task.completedAt = Date.now();
  task.completionNotes = completionNotes || '';

  await task.save();

  // Create notification for the task creator/manager
  await createSystemNotification(
    task.createdBy.toString(),
    'Task Completed',
    `Task "${task.title}" has been completed by ${req.user.name}`,
    'task',
    task._id,
    'success',
    `/manager/tasks/${task._id}`
  );

  // If task is related to an order, notify the client as well
  if (task.relatedOrder) {
    // Populate the order to get client information
    const populatedTask = await Task.findById(task._id)
      .populate({
        path: 'relatedOrder',
        select: 'client orderNumber title'
      });
    
    if (populatedTask.relatedOrder && populatedTask.relatedOrder.client) {
      await createSystemNotification(
        populatedTask.relatedOrder.client.toString(),
        'Task Completed on Your Order',
        `A task for your order #${populatedTask.relatedOrder.orderNumber} has been completed`,
        'order',
        populatedTask.relatedOrder._id,
        'success',
        `/client/orders/${populatedTask.relatedOrder._id}`
      );
    }
  }

  res.json(task);
});

// @desc    Assign task to employee
// @route   PUT /api/tasks/:id/assign
// @access  Private/Manager
const assignTask = asyncHandler(async (req, res) => {
  const { employeeId, notes } = req.body;
  
  if (!employeeId) {
    res.status(400);
    throw new Error('Please provide employee ID');
  }

  // Check if employee exists and is an employee
  const employee = await User.findById(employeeId);
  if (!employee || employee.role !== 'employee') {
    res.status(400);
    throw new Error('Invalid employee assignment');
  }

  const task = await Task.findById(req.params.id)
    .populate('relatedOrder', 'client orderNumber title');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Update the assigned employee
  task.assignedTo = employeeId;
  if (notes) task.notes = notes;

  await task.save();

  // Notify the assigned employee
  await createSystemNotification(
    employeeId,
    'New Task Assignment',
    `You have been assigned to task: ${task.title}`,
    'task',
    task._id,
    'info',
    `/employee/tasks/${task._id}`
  );

  // Notify other managers
  if (req.user.role === 'manager' || req.user.role === 'admin') {
    const managers = await User.find({ 
      role: { $in: ['manager', 'admin'] },
      _id: { $ne: req.user.id }
    });

    for (const manager of managers) {
      await createSystemNotification(
        manager._id,
        'Task Assignment Update',
        `${req.user.name} assigned ${employee.name} to task: ${task.title}`,
        'task',
        task._id,
        'info',
        `/manager/tasks/${task._id}`
      );
    }
  }

  // If task is related to an order, notify the client as well
  if (task.relatedOrder && task.relatedOrder.client) {
    await createSystemNotification(
      task.relatedOrder.client.toString(),
      'Task Assignment Update on Your Order',
      `An employee has been assigned to a task for your order #${task.relatedOrder.orderNumber}`,
      'order',
      task.relatedOrder._id,
      'info',
      `/client/orders/${task.relatedOrder._id}`
    );
  }

  res.json(task);
});

// @desc    Get recent tasks for dashboard
// @route   GET /api/tasks/recent
// @access  Private/Manager
const getRecentTasks = asyncHandler(async (req, res) => {
  try {
    // Allow customizing the limit via query parameter
    const limit = parseInt(req.query.limit) || (req.user.role === 'manager' || req.user.role === 'admin' ? 4 : 5);
    
    // For employees, show only their tasks
    if (req.user.role === 'employee') {
      // Get most recent tasks assigned to this employee
      const recentTasks = await Task.find({ assignedTo: req.user.id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .populate('relatedOrder', 'orderNumber title');

      return res.json(recentTasks);
    }
    
    // For managers, show all recent tasks
    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('relatedOrder', 'orderNumber title');

    res.json(recentTasks);
  } catch (error) {
    console.error('Error fetching recent tasks:', error);
    res.status(500);
    throw new Error('Failed to fetch recent tasks');
  }
});

// @desc    Get tasks assigned to the logged-in employee
// @route   GET /api/tasks/assigned
// @access  Private/Employee
const getAssignedTasks = asyncHandler(async (req, res) => {
  try {
    // Only allow employees to access this endpoint
    if (req.user.role !== 'employee') {
      res.status(403);
      throw new Error('Access denied. Only employees can access this endpoint.');
    }

    // Build query
    let query = { assignedTo: req.user.id };
    
    // Apply status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Get tasks assigned to this employee
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('relatedOrder', 'orderNumber title')
      .sort({ createdAt: -1 });

    res.json({
      tasks,
      total: tasks.length
    });
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    res.status(500);
    throw new Error('Failed to fetch assigned tasks');
  }
});

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addTaskComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  
  if (!content || content.trim() === '') {
    res.status(400);
    throw new Error('Comment content is required');
  }

  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('relatedOrder', 'client orderNumber title');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user has permission to comment on this task
  // Allow managers, the task creator, and the assigned employee
  if (
    req.user.role !== 'manager' && 
    req.user.role !== 'admin' &&
    task.createdBy._id.toString() !== req.user.id &&
    task.assignedTo._id.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error('Not authorized to comment on this task');
  }

  // Add the comment
  const newComment = {
    content,
    author: req.user._id,
    createdAt: Date.now(),
  };

  task.comments.push(newComment);
  await task.save();

  // Determine who to notify based on who added the comment
  const commentedBy = req.user.role === 'employee' ? 'Employee' : 'Manager';

  // Notify the task assignee if the comment is from someone else
  if (task.assignedTo._id.toString() !== req.user._id.toString()) {
    await createSystemNotification(
      task.assignedTo._id,
      'New Comment on Task',
      `${req.user.name} commented on task: ${task.title}`,
      'task',
      task._id,
      'info',
      `/employee/tasks/${task._id}`
    );
  }

  // Notify task creator if the comment is from assignee or another manager
  if (task.createdBy._id.toString() !== req.user._id.toString()) {
    await createSystemNotification(
      task.createdBy._id,
      'New Comment on Task',
      `${req.user.name} commented on task: ${task.title}`,
      'task',
      task._id,
      'info',
      req.user.role === 'manager' || req.user.role === 'admin' 
        ? `/manager/tasks/${task._id}`
        : `/employee/tasks/${task._id}`
    );
  }

  // If comment was added by employee, notify all managers
  if (req.user.role === 'employee') {
    const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
    for (const manager of managers) {
      if (manager._id.toString() !== task.createdBy._id.toString() && 
          manager._id.toString() !== req.user._id.toString()) {
        await createSystemNotification(
          manager._id,
          'New Comment on Task by Employee',
          `${req.user.name} commented on task: ${task.title}`,
          'task',
          task._id,
          'info',
          `/manager/tasks/${task._id}`
        );
      }
    }
  }

  // If the task is related to an order, notify the client about the comment
  if (task.relatedOrder && task.relatedOrder.client) {
    await createSystemNotification(
      task.relatedOrder.client.toString(),
      'New Comment on Task for Your Order',
      `A new comment has been added to a task for your order #${task.relatedOrder.orderNumber}`,
      'order',
      task.relatedOrder._id,
      'info',
      `/client/orders/${task.relatedOrder._id}`
    );
  }

  // Fetch the updated task with populated comments
  const updatedTask = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('comments.author', 'name email role');

  res.status(201).json(updatedTask.comments[updatedTask.comments.length - 1]);
});

// @desc    Get task comments
// @route   GET /api/tasks/:id/comments
// @access  Private
const getTaskComments = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('comments.author', 'name email role');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user has permission to view this task
  if (
    req.user.role === 'employee' &&
    task.assignedTo.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error('Not authorized to view comments for this task');
  }

  res.json(task.comments || []);
});

// @desc    Get task files
// @route   GET /api/tasks/:id/files
// @access  Private
const getTaskFiles = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user has permission to view this task
  if (
    req.user.role === 'employee' &&
    task.assignedTo.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error('Not authorized to view files for this task');
  }

  // Fetch files related to this task
  const files = await File.find({ 
    $or: [
      { relatedTask: req.params.id },
      { relatedOrder: task.relatedOrder }
    ]
  });

  res.json(files);
});

export {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask,
  assignTask,
  getRecentTasks,
  getAssignedTasks,
  addTaskComment,
  getTaskComments,
  getTaskFiles
};