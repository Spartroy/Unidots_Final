#!/bin/bash

echo "Testing build process..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install

# Run build
echo "Building frontend..."
npm run build

# Check if build was successful
if [ -d "build" ]; then
    echo "✅ Build successful! Build directory created."
    ls -la build/
else
    echo "❌ Build failed! Build directory not found."
    exit 1
fi

echo "Build test completed successfully!"
