@echo off
REM CCSA Mobile App - Crash Log Capture Script (Windows)
REM This script helps capture detailed logs from the Android app for debugging

echo.
echo [INFO] CCSA Mobile App - Debug Log Capture
echo ========================================
echo.

REM Check if adb is available
where adb >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] ADB not found!
    echo Please install Android SDK Platform Tools
    echo Download: https://developer.android.com/studio/releases/platform-tools
    pause
    exit /b 1
)

REM Check if device is connected
adb devices | find "device" | find /v "List" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No Android device connected!
    echo.
    echo Steps to connect:
    echo 1. Enable Developer Options on your phone
    echo 2. Enable USB Debugging
    echo 3. Connect via USB cable
    echo 4. Allow USB debugging when prompted
    pause
    exit /b 1
)

echo [OK] Device connected
echo.

REM Menu
echo Select debugging option:
echo 1. View live logs (all)
echo 2. View React Native logs only
echo 3. View crash logs (FATAL/ERROR)
echo 4. View CCSA app logs only
echo 5. Clear logs and start fresh
echo 6. Save logs to file
echo 7. View last crash
echo 8. Monitor memory usage
echo.
set /p OPTION="Enter option (1-8): "

if "%OPTION%"=="1" (
    echo [INFO] Showing all logs (Ctrl+C to stop)...
    adb logcat
) else if "%OPTION%"=="2" (
    echo [INFO] Showing React Native logs (Ctrl+C to stop)...
    adb logcat | findstr /i "ReactNativeJS"
) else if "%OPTION%"=="3" (
    echo [INFO] Showing crash logs (Ctrl+C to stop)...
    adb logcat | findstr /i "FATAL ERROR AndroidRuntime DEBUG"
) else if "%OPTION%"=="4" (
    echo [INFO] Showing CCSA app logs (Ctrl+C to stop)...
    adb logcat | findstr "ng.edu.cosmopolitan.fims"
) else if "%OPTION%"=="5" (
    echo [INFO] Clearing logs...
    adb logcat -c
    echo [OK] Logs cleared! Now showing new logs only...
    echo [INFO] Reproduce the crash now...
    adb logcat | findstr /i "ReactNativeJS FATAL ERROR"
) else if "%OPTION%"=="6" (
    set LOGFILE=ccsa_app_logs_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.txt
    set LOGFILE=%LOGFILE: =0%
    echo [INFO] Saving logs to: %LOGFILE%
    echo Capturing for 30 seconds... Reproduce the crash now!
    timeout /t 30 /nobreak > nul & adb logcat > "%LOGFILE%"
    echo [OK] Logs saved to: %LOGFILE%
    echo.
    echo Share this file for analysis!
    pause
) else if "%OPTION%"=="7" (
    echo [INFO] Last crash information:
    adb logcat -d | findstr /i /c:"FATAL EXCEPTION"
    pause
) else if "%OPTION%"=="8" (
    echo [INFO] Memory usage for CCSA app:
    adb shell dumpsys meminfo ng.edu.cosmopolitan.fims
    pause
) else (
    echo [ERROR] Invalid option
    pause
    exit /b 1
)
