import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import 'dotenv/config';

// Import routes
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import fileRoutes from './src/routes/fileRoutes.js';
import claimRoutes from './src/routes/claimRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import templateRoutes from './src/routes/templateRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';
import acidSolutionRoutes from './src/routes/acidSolutionRoutes.js';
import plateRoutes from './src/routes/plateRoutes.js';

// Import middleware
import { errorHandler } from './src/middleware/errorMiddleware.js';

// Import DB connection
import connectDB from './src/config/mongodb.js';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://your-vercel-domain.vercel.app'] 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/acid-solution', acidSolutionRoutes);
app.use('/api/plates', plateRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handler middleware
app.use(errorHandler);

// Health check endpoint for Vercel
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Start server (only if not in Vercel environment)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const startServer = async () => {
    try {
      // Connect to MongoDB
      await connectDB();
      
      // Start Express server
      app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      });
    } catch (error) {
      console.error(`Failed to start server: ${error.message}`);
      process.exit(1);
    }
  };

  startServer();
}

// Export for Vercel
export default app;