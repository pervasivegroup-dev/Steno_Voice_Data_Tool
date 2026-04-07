#!/bin/sh
set -e

APP_DIR="${APP_DIR:-/var/www/html}"

echo "Building the application..."

# Navigate to app directory
cd "$APP_DIR"

# Set production environment
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Install dependencies
echo "Installing dependencies..."
npm ci --omit=dev --legacy-peer-deps

# Clean previous build
echo "Cleaning previous build..."
rm -rf .next

# Build the application in production mode
echo "Building application in production mode..."
npm run build

# Check if standalone build was created
if [ ! -f "$APP_DIR/.next/standalone/server.js" ]; then
  echo "❌ Standalone build failed! .next/standalone/server.js not found."
  echo "This usually means the build didn't complete successfully."
  exit 1
fi

# Copy static files to standalone directory
echo "Copying static files..."
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
cp -r public .next/standalone/ 2>/dev/null || true

# Copy any additional static files
cp -r recording_examples .next/standalone/ 2>/dev/null || true

# Set proper permissions
chmod +x .next/standalone/server.js

echo "✅ Build successful! Standalone server created with static assets."
echo "✅ Plesk will automatically start the application using .next/standalone/server.js"