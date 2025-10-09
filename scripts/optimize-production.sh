#!/bin/bash

# CCSA Mobile App Production Optimization Script
# This script optimizes the mobile app for production builds

echo "🚀 Optimizing CCSA Mobile App for Production..."

# Set production environment
export NODE_ENV=production

# Clean up any existing build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf dist-android
rm -f App.component-test.js App.diagnosis.js 2>/dev/null
rm -f src/utils/testEnvironment.js 2>/dev/null

# Remove any remaining mock data files
find src/ -name "*mock*" -type f -delete 2>/dev/null
find src/ -name "*test*" -type f -delete 2>/dev/null
find src/ -name "*debug*" -type f -delete 2>/dev/null

# Clear npm cache
echo "🔄 Clearing caches..."
npm cache clean --force || true

# Install dependencies with production optimizations
echo "📦 Installing optimized dependencies..."
npm ci --production=false

# Optimize assets
echo "🖼️ Optimizing assets..."
if command -v optipng &> /dev/null; then
    find assets -name "*.png" -exec optipng -o2 {} \;
    echo "✅ PNG assets optimized"
else
    echo "⚠️ optipng not found, skipping PNG optimization"
fi

# Validate app configuration
echo "🔍 Validating app configuration..."
if [ ! -f ".env" ]; then
    echo "⚠️ .env file not found, using defaults"
fi

# Check for environment variables
echo "� Environment Configuration:"
echo "NODE_ENV: $NODE_ENV"
echo "API Base URL: ${EXPO_PUBLIC_API_BASE_URL:-'http://172.20.10.4:3000'}"

# Run pre-build checks
echo "🔎 Running pre-build checks..."
npx expo doctor || echo "⚠️ Some doctor checks failed, continuing..."

# Build optimization summary
echo "✅ Production optimization complete!"
echo ""
echo "📱 Ready for build commands:"
echo "   - Development APK:  npm run build:apk"
echo "   - Production APK:   npm run build:apk:prod"
echo "   - App Bundle:       npm run build:android:prod"
echo "   - iOS:              npm run build:ios:prod"
echo ""
echo "🔧 Build profiles available:"
echo "   - development: Debug builds with dev client"
echo "   - preview: Internal testing builds"  
echo "   - apk: Release APK builds"
echo "   - production: Store-ready builds"
