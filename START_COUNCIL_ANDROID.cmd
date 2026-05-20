@echo off
cd /d "%~dp0"
start "Council API" cmd /k "cd /d ""%~dp0"" && npm.cmd run api"
echo Starting Council on Android emulator...
call npm.cmd run android
pause
