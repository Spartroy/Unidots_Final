#!/bin/bash

# Production Build Script for Unidots Frontend
echo "🚀 Starting production build..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf build/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set production environment variables
export NODE_ENV=production
export GENERATE_SOURCEMAP=false
export CI=false

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build output directory: build/"
    echo "📊 Build size:"
    du -sh build/
    
    # List build contents
    echo "📋 Build contents:"
    ls -la build/
    
    echo "🎉 Production build ready for deployment!"
else
    echo "❌ Build failed!"
    exit 1
fi
