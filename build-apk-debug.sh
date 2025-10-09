#!/bin/bash

# Build release APK locally (optimized, production-ready)
# This requires a keystore for signing

set -e  # Exit on error

echo "🚀 Building release APK locally..."
echo ""

# Set Android Studio's JDK
export JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"
export PATH="$JAVA_HOME/bin:$PATH"

# Verify Java
echo "✓ Using Java from: $JAVA_HOME"
java -version
echo ""

# Navigate to android directory
cd android

echo "📦 Cleaning previous builds..."
./gradlew clean

echo ""
echo "🔨 Building release APK..."
./gradlew assembleRelease

echo ""
echo "✅ Build complete!"
echo ""
echo "📱 APK Location:"
APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    echo "   $(pwd)/$APK_PATH"
    echo ""
    echo "📊 APK Size: $(du -h "$APK_PATH" | cut -f1)"
    echo ""
    echo "🎯 To install on device:"
    echo "   adb install $APK_PATH"
    echo ""
    echo "⚠️  Note: Release APK requires signing with a keystore"
else
    echo "   ❌ APK not found at expected location"
    exit 1
fi
