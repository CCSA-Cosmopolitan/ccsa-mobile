#!/bin/bash

# CCSA Mobile App - Crash Log Capture Script
# This script helps capture detailed logs from the Android app for debugging

echo "🔍 CCSA Mobile App - Debug Log Capture"
echo "========================================"
echo ""

# Check if adb is available
if ! command -v adb &> /dev/null; then
    echo "❌ ADB not found!"
    echo "Please install Android SDK Platform Tools"
    echo "Download: https://developer.android.com/studio/releases/platform-tools"
    exit 1
fi

# Check if device is connected
DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l)
if [ $DEVICES -eq 0 ]; then
    echo "❌ No Android device connected!"
    echo ""
    echo "Steps to connect:"
    echo "1. Enable Developer Options on your phone"
    echo "2. Enable USB Debugging"
    echo "3. Connect via USB cable"
    echo "4. Allow USB debugging when prompted"
    exit 1
fi

echo "✅ Device connected"
echo ""

# Menu
echo "Select debugging option:"
echo "1. View live logs (all)"
echo "2. View React Native logs only"
echo "3. View crash logs (FATAL/ERROR)"
echo "4. View CCSA app logs only"
echo "5. Clear logs and start fresh"
echo "6. Save logs to file"
echo "7. View last crash"
echo "8. Monitor memory usage"
echo ""
read -p "Enter option (1-8): " OPTION

case $OPTION in
    1)
        echo "📱 Showing all logs (Ctrl+C to stop)..."
        adb logcat
        ;;
    2)
        echo "⚛️ Showing React Native logs (Ctrl+C to stop)..."
        adb logcat | grep -i "ReactNativeJS"
        ;;
    3)
        echo "💥 Showing crash logs (Ctrl+C to stop)..."
        adb logcat | grep -E "FATAL|ERROR|AndroidRuntime|DEBUG"
        ;;
    4)
        echo "📱 Showing CCSA app logs (Ctrl+C to stop)..."
        adb logcat | grep "ng.edu.cosmopolitan.fims"
        ;;
    5)
        echo "🧹 Clearing logs..."
        adb logcat -c
        echo "✅ Logs cleared! Now showing new logs only..."
        echo "⚛️ Reproduce the crash now..."
        adb logcat | grep -E "ReactNativeJS|FATAL|ERROR"
        ;;
    6)
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        LOGFILE="ccsa_app_logs_${TIMESTAMP}.txt"
        echo "💾 Saving logs to: $LOGFILE"
        echo "Capturing for 30 seconds... Reproduce the crash now!"
        timeout 30 adb logcat > "$LOGFILE"
        echo "✅ Logs saved to: $LOGFILE"
        echo ""
        echo "Share this file for analysis!"
        ;;
    7)
        echo "💥 Last crash information:"
        adb logcat -d | grep -A 50 "FATAL EXCEPTION"
        ;;
    8)
        echo "🧠 Memory usage for CCSA app:"
        adb shell dumpsys meminfo ng.edu.cosmopolitan.fims
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac
