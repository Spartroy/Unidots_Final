#!/bin/bash

# 🚀 Vercel Deployment Script for Unidots V2
# This script helps prepare and deploy your application to Vercel

echo "🚀 Starting Vercel deployment preparation..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing now..."
    npm install -g vercel
fi

# Check if all dependencies are installed
echo "📦 Installing dependencies..."
npm run install-all

# Build the frontend
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

# Check if build was successful
if [ ! -d "frontend/build" ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend build successful!"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo "🌐 Your app should be available at the URL provided above"
echo ""
echo "📋 Next steps:"
echo "1. Set up environment variables in Vercel dashboard"
echo "2. Configure MongoDB Atlas connection"
echo "3. Test all features"
echo "4. Set up custom domain (optional)"
echo ""
echo "📖 For detailed instructions, see VERCEL_DEPLOYMENT.md"
