# 🚀 Vercel Deployment Guide for Unidots V2

## 📋 Prerequisites

1. **MongoDB Atlas Database**: Set up a free MongoDB Atlas cluster
2. **GitHub Repository**: Push your code to GitHub
3. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)

## 🔧 Environment Variables Setup

### Required Environment Variables

Set these in your Vercel project dashboard:

#### Backend Environment Variables:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/unidots
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

#### Frontend Environment Variables:
```bash
REACT_APP_API_URL=https://your-vercel-domain.vercel.app
```

## 🚀 Deployment Steps

### Step 1: Prepare Your Repository

1. **Ensure all files are committed** to your GitHub repository
2. **Verify the project structure**:
   ```
   ├── frontend/
   ├── backend/
   ├── vercel.json
   ├── package.json
   └── README.md
   ```

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (root of your project)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/build`
   - **Install Command**: `npm run install-all`

### Step 3: Set Environment Variables

1. **Go to your project settings** in Vercel
2. **Navigate to "Environment Variables"**
3. **Add the following variables**:

#### For Production:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/unidots
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
FRONTEND_URL=https://your-vercel-domain.vercel.app
REACT_APP_API_URL=https://your-vercel-domain.vercel.app
```

### Step 4: Deploy

1. **Click "Deploy"**
2. **Wait for the build to complete**
3. **Your app will be available at**: `https://your-project-name.vercel.app`

## 🔧 Configuration Files

### vercel.json (Already configured)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/server.js"
    },
    {
      "src": "/uploads/(.*)",
      "dest": "/backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/build/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "backend/server.js": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/backend/server.js"
    },
    {
      "source": "/uploads/(.*)",
      "destination": "/backend/server.js"
    },
    {
      "source": "/((?!api|uploads).*)",
      "destination": "/frontend/build/index.html"
    }
  ]
}
```

## 🐍 Python ML Service Deployment

Since Vercel doesn't support Python serverless functions well, deploy the ML service separately:

### Option 1: Railway (Recommended)
1. **Create new Railway project** for Python service
2. **Set root directory** to `backend/Predictor`
3. **Configure**:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
4. **Set environment variables**:
   ```bash
   FRONTEND_URL=https://your-vercel-domain.vercel.app
   ```

### Option 2: Render
1. **Create new Web Service** on Render
2. **Set root directory** to `backend/Predictor`
3. **Configure**:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`

## 📁 File Storage

### Option 1: Cloudinary (Recommended)
1. **Sign up** at [cloudinary.com](https://cloudinary.com)
2. **Install**: `npm install cloudinary`
3. **Update backend** to use Cloudinary instead of local storage
4. **Set environment variables**:
   ```bash
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Option 2: Keep Local Storage
- Files will be stored in Vercel's temporary storage
- **Note**: Files will be lost on function cold starts

## 🔍 Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check if all dependencies are installed
   - Verify Node.js version (>=18.0.0)
   - Check build logs in Vercel dashboard

2. **API Routes Not Working**:
   - Verify environment variables are set correctly
   - Check CORS configuration
   - Ensure MongoDB connection string is correct

3. **File Uploads Not Working**:
   - Consider using Cloudinary for file storage
   - Check file size limits (Vercel has 4.5MB limit for serverless functions)

4. **Database Connection Issues**:
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has correct permissions

### Health Check:
Visit `https://your-domain.vercel.app/api/health` to verify the backend is running.

## 🚨 Important Notes

1. **Serverless Limitations**:
   - Function timeout: 30 seconds
   - Payload size: 4.5MB
   - Cold starts may occur

2. **Environment Variables**:
   - Set them in Vercel dashboard
   - Redeploy after changing environment variables

3. **Custom Domain**:
   - Add custom domain in Vercel dashboard
   - Update CORS origins accordingly

4. **Monitoring**:
   - Use Vercel Analytics for performance monitoring
   - Check function logs in Vercel dashboard

## 🎯 Post-Deployment Checklist

- [ ] Environment variables are set correctly
- [ ] MongoDB connection is working
- [ ] API endpoints are responding
- [ ] File uploads are working (if using local storage)
- [ ] Frontend is loading correctly
- [ ] Authentication is working
- [ ] All features are functional
- [ ] Custom domain is configured (if needed)
- [ ] SSL certificate is active

## 🔄 Updates and Redeployment

1. **Push changes** to your GitHub repository
2. **Vercel will automatically redeploy** (if auto-deploy is enabled)
3. **Or manually redeploy** from Vercel dashboard

Your Unidots V2 application is now ready for production deployment on Vercel! 🚀
