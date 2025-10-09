#!/bin/bash

# Check APK build status

echo "🔍 Checking APK build status..."
echo ""

APK_DEBUG="android/app/build/outputs/apk/debug/app-debug.apk"
APK_RELEASE="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_DEBUG" ]; then
    echo "✅ Debug APK found!"
    echo "   Location: $APK_DEBUG"
    echo "   Size: $(du -h "$APK_DEBUG" | cut -f1)"
    echo "   Modified: $(stat -c %y "$APK_DEBUG" 2>/dev/null || stat -f "%Sm" "$APK_DEBUG")"
    echo ""
    echo "🎯 To install: adb install $APK_DEBUG"
else
    echo "❌ Debug APK not found"
fi

echo ""

if [ -f "$APK_RELEASE" ]; then
    echo "✅ Release APK found!"
    echo "   Location: $APK_RELEASE"
    echo "   Size: $(du -h "$APK_RELEASE" | cut -f1)"
    echo "   Modified: $(stat -c %y "$APK_RELEASE" 2>/dev/null || stat -f "%Sm" "$APK_RELEASE")"
    echo ""
    echo "🎯 To install: adb install $APK_RELEASE"
else
    echo "❌ Release APK not found"
fi

echo ""
echo "📊 Build directories:"
ls -lh android/app/build/outputs/apk/ 2>/dev/null || echo "   No APK output directory yet"
