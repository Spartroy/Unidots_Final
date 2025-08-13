import asyncHandler from 'express-async-handler';
import File from '../models/fileModel.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import Order from '../models/orderModel.js';

// Calculate the __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept images, PDFs, and AI files
  const allowedFileTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/tiff',
    'application/pdf',
    'application/postscript', // AI files
    'application/illustrator', // AI files
  ];

  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Please upload an image, PDF, or AI file.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// Middleware for handling file uploads
const uploadMiddleware = upload.single('file');

// Middleware for handling multiple file uploads
const uploadMultipleMiddleware = upload.array('files', 10); // Allow up to 10 files

// @desc    Upload a file
// @route   POST /api/files
// @access  Private
export const uploadFile = asyncHandler(async (req, res) => {
  // Handle upload using multer middleware
  uploadMiddleware(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred during upload
      res.status(400);
      throw new Error(`Upload error: ${err.message}`);
    } else if (err) {
      // An unknown error occurred
      res.status(400);
      throw new Error(`Error: ${err.message}`);
    }

    // If no file was uploaded
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a file');
    }

    const { fileType, relatedOrder, relatedClaim, version, notes, tags } = req.body;

    // Create file record in database
    const file = await File.create({
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      fileType: fileType || 'other',
      uploadedBy: req.user.id,
      relatedOrder: relatedOrder || null,
      relatedClaim: relatedClaim || null,
      version: version || 1,
      notes: notes || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    });

    // Generate preview for image files
    if (req.file.mimetype.startsWith('image/')) {
      try {
        const previewPath = path.join(
          path.dirname(req.file.path),
          'preview-' + req.file.filename
        );

        // Generate preview using sharp
        await sharp(req.file.path)
          .resize(300, 300, { fit: 'inside' })
          .toFile(previewPath);

        // Update file with preview path
        file.previewPath = previewPath;
        await file.save();
      } catch (error) {
        console.error('Preview generation error:', error);
        // Continue even if preview generation fails
      }
    }

    res.status(201).json(file);
  });
});

// @desc    Get all files
// @route   GET /api/files
// @access  Private
export const getFiles = asyncHandler(async (req, res) => {
  let query = {};

  // Filter by related order if provided
  if (req.query.order) {
    query.relatedOrder = req.query.order;
  }

  // Filter by related claim if provided
  if (req.query.claim) {
    query.relatedClaim = req.query.claim;
  }

  // Filter by file type if provided
  if (req.query.fileType) {
    query.fileType = req.query.fileType;
  }

  // Filter by uploader if provided
  if (req.query.uploadedBy) {
    query.uploadedBy = req.query.uploadedBy;
  }

  // Search by filename or tags
  if (req.query.search) {
    query.$or = [
      { originalname: { $regex: req.query.search, $options: 'i' } },
      { tags: { $in: [new RegExp(req.query.search, 'i')] } },
    ];
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;

  // Get files with pagination
  const files = await File.find(query)
    .populate('uploadedBy', 'name email')
    .populate('relatedOrder', 'orderNumber title')
    .populate('relatedClaim', 'claimNumber title')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Get total count for pagination
  const total = await File.countDocuments(query);

  res.json({
    files,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
});

// @desc    Get file by ID
// @route   GET /api/files/:id
// @access  Private
export const getFileById = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id)
    .populate('uploadedBy', 'name email')
    .populate('relatedOrder', 'orderNumber title')
    .populate('relatedClaim', 'claimNumber title')
    .populate('previousVersions');

  if (file) {
    res.json(file);
  } else {
    res.status(404);
    throw new Error('File not found');
  }
});

// @desc    Download file
// @route   GET /api/files/:id/download
// @access  Public (with basic validation)
export const downloadFile = asyncHandler(async (req, res) => {
  console.log('Download file request for ID:', req.params.id);
  
  try {
    const file = await File.findById(req.params.id)
      .populate({
        path: 'relatedOrder',
        select: 'orderNumber client assignedTo'
      });

    if (!file) {
      console.error('File not found in database:', req.params.id);
      res.status(404);
      throw new Error('File not found');
    }

    console.log('Found file in database:', file.filename, 'path:', file.path);

    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      console.error('File not found on disk:', file.path);
      res.status(404);
      throw new Error('File not found on server');
    }

    // Determine content type based on file extension
    const mimeType = file.mimetype || 'application/octet-stream';
    console.log('Setting content type:', mimeType);

    // Set content headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.originalname || file.filename)}"`
    );

    // Stream file to response
    const fileStream = fs.createReadStream(file.path);
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(500).send('Error streaming file');
    });
    
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).send('Error downloading file: ' + error.message);
  }
});

// @desc    Update file metadata
// @route   PUT /api/files/:id
// @access  Private
export const updateFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id);

  if (!file) {
    res.status(404);
    throw new Error('File not found');
  }

  // Check if user has permission to update
  if (
    file.uploadedBy.toString() !== req.user.id &&
    req.user.role !== 'manager' &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to update this file');
  }

  // Update fields
  const { fileType, notes, tags, isActive } = req.body;

  if (fileType) file.fileType = fileType;
  if (notes) file.notes = notes;
  if (tags) file.tags = tags.split(',').map(tag => tag.trim());
  if (isActive !== undefined) file.isActive = isActive;

  const updatedFile = await file.save();

  res.json(updatedFile);
});

// @desc    Upload new version of a file
// @route   POST /api/files/:id/version
// @access  Private
export const uploadNewVersion = asyncHandler(async (req, res) => {
  const originalFile = await File.findById(req.params.id);

  if (!originalFile) {
    res.status(404);
    throw new Error('Original file not found');
  }

  // Handle upload using multer middleware
  uploadMiddleware(req, res, async function (err) {
    if (err) {
      res.status(400);
      throw new Error(`Upload error: ${err.message}`);
    }

    // If no file was uploaded
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a file');
    }

    // Create new file record for the new version
    const newVersion = await File.create({
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      fileType: originalFile.fileType,
      uploadedBy: req.user.id,
      relatedOrder: originalFile.relatedOrder,
      relatedClaim: originalFile.relatedClaim,
      version: originalFile.version + 1,
      previousVersions: [originalFile._id, ...originalFile.previousVersions],
      notes: req.body.notes || `New version of ${originalFile.originalname}`,
      tags: originalFile.tags,
    });

    // Generate preview for image files
    if (req.file.mimetype.startsWith('image/')) {
      try {
        const previewPath = path.join(
          path.dirname(req.file.path),
          'preview-' + req.file.filename
        );

        // Generate preview using sharp
        await sharp(req.file.path)
          .resize(300, 300, { fit: 'inside' })
          .toFile(previewPath);

        // Update file with preview path
        newVersion.previewPath = previewPath;
        await newVersion.save();
      } catch (error) {
        console.error('Preview generation error:', error);
      }
    }

    // Mark original file as inactive
    originalFile.isActive = false;
    await originalFile.save();

    res.status(201).json(newVersion);
  });
});

// @desc    Delete file
// @route   DELETE /api/files/:id
// @access  Private
export const deleteFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id);

  if (!file) {
    res.status(404);
    throw new Error('File not found');
  }

  // Check if user has permission to delete
  if (
    file.uploadedBy.toString() !== req.user.id &&
    req.user.role !== 'manager' &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this file');
  }

  // Instead of physically deleting, mark as inactive
  file.isActive = false;
  await file.save();

  res.json({ message: 'File marked as deleted' });
});

// @desc    Upload multiple files
// @route   POST /api/files/upload
// @access  Private
export const uploadMultipleFiles = asyncHandler(async (req, res) => {
  console.log('Received multiple file upload request');
  console.log('User making request:', req.user.id, req.user.name, req.user.role);
  
  // Handle upload using multer middleware
  uploadMultipleMiddleware(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred during upload
      console.error('Multer error:', err);
      res.status(400);
      throw new Error(`Upload error: ${err.message}`);
    } else if (err) {
      // An unknown error occurred
      console.error('Unknown upload error:', err);
      res.status(400);
      throw new Error(`Error: ${err.message}`);
    }

    // If no files were uploaded, check if a design link was provided
    if (!req.files || req.files.length === 0) {
      const { designLink, relatedOrder, notes, fileType } = req.body;
      
      // If it's a design file upload, check if either files or design link is provided
      if (fileType === 'design') {
        if (!designLink || !designLink.trim()) {
          console.error('No files or design link found in design upload request');
          res.status(400);
          throw new Error('Please upload at least one file OR provide a design link to complete the design stage');
        }
      }
      
      // Handle design link submission
      if (designLink && relatedOrder) {
        console.log('Design link provided without files:', designLink);
        
        // Update the order with the design link
        const order = await Order.findById(relatedOrder);
        if (order) {
          // Store the design link in the order
          if (!order.designLinks) {
            order.designLinks = [];
          }
          order.designLinks.push({
            link: designLink,
            addedBy: req.user.id,
            addedAt: new Date(),
            notes: notes || ''
          });
          
          await order.save();
          
          console.log('Design link saved to order:', relatedOrder);
          
          return res.status(200).json({
            message: 'Design link saved successfully',
            designLink: designLink,
            orderId: relatedOrder
          });
        } else {
          res.status(404);
          throw new Error('Order not found');
        }
      }
      
      console.error('No files found in request and no design link provided');
      res.status(400);
      throw new Error('Please upload at least one file OR provide a design link');
    }

    console.log(`${req.files.length} files received for upload`);
    
    try {
      const { fileType, relatedOrder, relatedClaim, taskId, notes } = req.body;
      console.log('Upload metadata:', { fileType, relatedOrder, notes });

      // Create file records in database
      const uploadedFiles = [];

      for (const file of req.files) {
        console.log(`Processing file: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`);
        
        const fileRecord = await File.create({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          fileType: fileType || 'other',
          uploadedBy: req.user.id,
          relatedOrder: relatedOrder || null,
          relatedClaim: relatedClaim || null,
          relatedTask: taskId || null,
          notes: notes || '',
        });

        console.log('Created file record with ID:', fileRecord._id, 'uploadedBy:', fileRecord.uploadedBy);

        // Generate preview for image files
        if (file.mimetype.startsWith('image/')) {
          try {
            const previewPath = path.join(
              path.dirname(file.path),
              'preview-' + file.filename
            );

            // Generate preview using sharp
            await sharp(file.path)
              .resize(300, 300, { fit: 'inside' })
              .toFile(previewPath);

            // Update file with preview path
            fileRecord.previewPath = previewPath;
            await fileRecord.save();
          } catch (error) {
            console.error('Preview generation error:', error);
            // Continue even if preview generation fails
          }
        }

        uploadedFiles.push(fileRecord);
      }

      // Update order record to include these files and notify client when courier label is uploaded
      if (relatedOrder) {
        console.log('Updating order with uploaded files:', relatedOrder);
        const order = await Order.findById(relatedOrder);
        if (order) {
          // Add file references to the order
          const fileIds = uploadedFiles.map(file => file._id);
          console.log('Adding file IDs to order:', fileIds);
          await Order.findByIdAndUpdate(
            relatedOrder,
            { $push: { files: { $each: fileIds } } }
          );

          // If the uploaded type is courier, mark order as "Delivering" and notify the client
          if ((req.body.fileType || '').toLowerCase() === 'courier') {
            try {
              // Update order status to Delivering
              order.status = 'Delivering';
              
              // Update delivery stage status to In Progress
              if (!order.stages.delivery) {
                order.stages.delivery = {};
              }
              order.stages.delivery.status = 'In Progress';
              order.stages.delivery.startDate = new Date();
              
              // Add to history
              order.history.push({
                action: 'Shipment Label Uploaded',
                user: req.user.id,
                details: 'Courier uploaded shipment label. Order marked as Delivering.',
                timestamp: new Date()
              });
              
              await order.save();

              // Create notification to client
              try {
                const { createSystemNotification } = await import('./notificationController.js');
                await createSystemNotification(
                  order.client,
                  'Your order has been shipped',
                  `Order ${order.orderNumber} is now on the way.`,
                  'order',
                  order._id,
                  'success',
                  `/client/orders/${order._id}`
                );
              } catch (notifyErr) {
                console.warn('Failed to create shipment notification:', notifyErr?.message || notifyErr);
              }
            } catch (statusErr) {
              console.warn('Failed to update order to Delivering:', statusErr?.message || statusErr);
            }
          }
        }
      }

      console.log(`Successfully uploaded ${uploadedFiles.length} files`);
      res.status(201).json(uploadedFiles);
    } catch (error) {
      console.error('File upload database error:', error);
      res.status(500);
      throw new Error(`Failed to process uploaded files: ${error.message}`);
    }
  });
});

export {
  uploadMiddleware,
};