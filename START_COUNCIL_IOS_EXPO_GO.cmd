@echo off
cd /d "%~dp0"
echo Starting Council for iPhone/iPad with Expo Go...
echo Install Expo Go from the App Store, then scan the QR code shown in this terminal/browser.
call npm.cmd run ios:expo-go
pause
