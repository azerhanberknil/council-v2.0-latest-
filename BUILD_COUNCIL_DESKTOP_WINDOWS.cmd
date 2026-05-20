@echo off
cd /d "%~dp0"
echo Building Council Windows desktop installer with Tauri...
call npm.cmd run desktop:build:windows
if errorlevel 1 (
  echo.
  echo Desktop build failed. Check the terminal output above.
  pause
  exit /b 1
)
echo.
echo Build completed.
echo Installer output is under src-tauri\target\release\bundle\nsis
pause
