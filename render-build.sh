#!/bin/bash

# Render.com build script for Next.js application
echo "🚀 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"