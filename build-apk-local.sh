#!/bin/bash

# Build APK locally using Gradle (no Expo build service needed)
# This script builds a debug APK that can be installed on any Android device

set -e  # Exit on error

echo "🚀 Building APK locally without Expo..."
echo ""

# Set Android Studio's JDK and Android SDK
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
export ANDROID_HOME="/c/Users/user 2/AppData/Local/Android/Sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

# Verify Java
echo "✓ Using Java from: $JAVA_HOME"
java -version
echo ""

# Verify Android SDK
echo "✓ Android SDK: $ANDROID_HOME"
echo ""

# Navigate to android directory
cd android

# Create local.properties if it doesn't exist
if [ ! -f "local.properties" ]; then
    echo "Creating local.properties..."
    echo "sdk.dir=C:\\\\Users\\\\user 2\\\\AppData\\\\Local\\\\Android\\\\Sdk" > local.properties
fi

echo "📦 Cleaning previous builds..."
./gradlew clean --no-daemon

echo ""
echo "🔨 Building debug APK (this may take several minutes)..."
echo "   First build will download dependencies (~5-10 minutes)..."
./gradlew assembleDebug --no-daemon

echo ""
echo "✅ Build complete!"
echo ""
echo "📱 APK Location:"
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo "   $(pwd)/$APK_PATH"
    echo ""
    echo "📊 APK Size: $(du -h "$APK_PATH" | cut -f1)"
    echo ""
    echo "🎯 To install on device:"
    echo "   adb install $APK_PATH"
else
    echo "   ❌ APK not found at expected location"
    exit 1
fi
