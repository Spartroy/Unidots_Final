# 🚀 Unidots V2 Deployment Guide

## 📋 Prerequisites

1. **MongoDB Database**: Set up a free MongoDB Atlas cluster
2. **Environment Variables**: Configure your `.env` files
3. **Git Repository**: Push your code to GitHub

## 🆓 Free Serverless Platforms

### Option 1: Railway (Recommended - Full Stack)
**Free Tier**: $5/month credit, 500 hours/month

#### Steps:
1. **Sign up** at [railway.app](https://railway.app)
2. **Connect your GitHub** repository
3. **Create new project** → Deploy from GitHub repo
4. **Set environment variables**:
   ```
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_jwt_secret
   NODE_ENV=production
   PORT=4000
   ```
5. **Deploy** - Railway will automatically detect and deploy your app

#### Advantages:
- ✅ Full-stack deployment (backend + frontend)
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ Database integration
- ✅ File uploads work

---

### Option 2: Render (Alternative Full Stack)
**Free Tier**: 750 hours/month

#### Steps:
1. **Sign up** at [render.com](https://render.com)
2. **Create new Web Service**
3. **Connect GitHub** repository
4. **Configure**:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
5. **Set environment variables** (same as Railway)
6. **Deploy**

---

### Option 3: Vercel (Frontend Only)
**Free Tier**: Unlimited deployments

#### Steps:
1. **Sign up** at [vercel.com](https://vercel.com)
2. **Import** your GitHub repository
3. **Configure**:
   - **Framework Preset**: Other
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. **Set environment variables**:
   ```
   REACT_APP_API_URL=https://your-backend-url.com
   ```
5. **Deploy**

---

### Option 4: Netlify (Frontend Only)
**Free Tier**: 100GB bandwidth/month

#### Steps:
1. **Sign up** at [netlify.com](https://netlify.com)
2. **Connect GitHub** repository
3. **Configure**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
4. **Set environment variables**:
   ```
   REACT_APP_API_URL=https://your-backend-url.com
   ```
5. **Deploy**

---

## 🔧 Environment Variables Setup

### Backend (.env)
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/unidots
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
PORT=4000
```

### Frontend (.env)
```bash
REACT_APP_API_URL=https://your-backend-domain.com
```

---

## 🐍 Python ML Service Deployment

### Option A: Deploy on Railway (Separate Service)
1. **Create new Railway project** for Python service
2. **Set root directory** to `backend/Predictor`
3. **Configure**:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
4. **Set environment variables**:
   ```
   FRONTEND_URL=https://your-frontend-url.com
   ```
5. **Upload model file**: Add `DotDeformationDetector.h5` to the project

### Option B: Deploy on Render (Python Service)
1. **Create new Web Service** on Render
2. **Set root directory** to `backend/Predictor`
3. **Configure**:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
4. **Deploy**

---

## 📁 File Storage Solutions

### Option 1: Cloudinary (Free Tier)
1. **Sign up** at [cloudinary.com](https://cloudinary.com)
2. **Install**: `npm install cloudinary`
3. **Configure** in your backend:
   ```javascript
   import cloudinary from 'cloudinary';
   cloudinary.config({
     cloud_name: 'your_cloud_name',
     api_key: 'your_api_key',
     api_secret: 'your_api_secret'
   });
   ```

### Option 2: AWS S3 (Free Tier)
1. **Create AWS account**
2. **Set up S3 bucket**
3. **Install**: `npm install aws-sdk`
4. **Configure** S3 upload in your backend

### Option 3: Keep Local Storage (Railway/Render)
- Files will persist during deployment
- **Note**: Files may be lost on service restart

---

## 🔄 Deployment Commands

```bash
# Install all dependencies
npm run install-all

# Build frontend
npm run build

# Deploy to Railway
npm run deploy:railway

# Deploy to Render
npm run deploy:render

# Deploy to Vercel
npm run deploy:vercel
```

---

## 🚨 Important Notes

1. **Database**: Use MongoDB Atlas (free tier available)
2. **File Uploads**: Consider cloud storage for production
3. **Environment Variables**: Set them in your platform's dashboard
4. **CORS**: Update Python service origins with your actual frontend URL
5. **Model File**: Ensure `DotDeformationDetector.h5` is included in deployment

---

## 🎯 Recommended Deployment Strategy

1. **Backend + Frontend**: Deploy on Railway
2. **Python ML Service**: Deploy on Railway (separate service)
3. **File Storage**: Use Cloudinary (free tier)
4. **Database**: MongoDB Atlas (free tier)

This gives you a complete, free serverless deployment! 🚀 