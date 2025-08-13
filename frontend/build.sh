#!/bin/bash

# Set CI to false to prevent treating warnings as errors
export CI=false

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run the build
echo "Building the application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    exit 0
else
    echo "❌ Build failed!"
    exit 1
fi
