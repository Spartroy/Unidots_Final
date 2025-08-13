# Vercel Deployment Guide

## Current Configuration

The project is configured as a monorepo with:
- Frontend: React app in `/frontend`
- Backend: Node.js/Express app in `/backend`

## Vercel Configuration

The `vercel.json` file is configured to:
1. Build the frontend from `frontend/package.json`
2. Deploy the backend as a serverless function
3. Route API calls to the backend
4. Serve static files from the frontend build

## Troubleshooting Steps

### 1. Test Build Locally
Before deploying, test the build process locally:

```bash
# Test frontend build
cd frontend
npm install
npm run build

# Check if build directory is created
ls -la build/
```

### 2. Check Dependencies
Ensure all dependencies are properly listed in `frontend/package.json`:
- React and React DOM
- React Router DOM
- Tailwind CSS
- All UI libraries (Headless UI, Heroicons, etc.)

### 3. Environment Variables
Make sure to set these environment variables in Vercel:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Your JWT secret key
- `FRONTEND_URL` - Your Vercel frontend URL
- Any other environment variables your backend needs

### 4. Common Issues and Solutions

#### Issue: "Command npm run build exited with 1"
**Solution**: 
- Check if all dependencies are installed
- Ensure no TypeScript errors (if using TS)
- Verify all imports are correct
- Check for missing environment variables

#### Issue: Frontend not loading
**Solution**:
- Verify the build directory path in `vercel.json`
- Check if static files are being served correctly
- Ensure routing is configured properly

#### Issue: API calls failing
**Solution**:
- Verify backend is deployed as serverless function
- Check CORS configuration in backend
- Ensure API routes are properly configured

### 5. Deployment Commands

```bash
# Deploy to Vercel
vercel --prod

# Or use the script
npm run deploy:vercel
```

### 6. Monitoring Deployment

1. Check Vercel dashboard for build logs
2. Monitor function logs for backend issues
3. Test API endpoints after deployment
4. Verify frontend routing works correctly

## File Structure

```
/
├── frontend/          # React app
│   ├── package.json
│   ├── src/
│   └── public/
├── backend/           # Node.js/Express app
│   ├── package.json
│   ├── server.js
│   └── src/
├── vercel.json        # Vercel configuration
└── package.json       # Root package.json
```

## Support

If you continue to have issues:
1. Check Vercel build logs for specific error messages
2. Test the build process locally
3. Verify all environment variables are set
4. Ensure all dependencies are compatible
