@echo off
cd /d "%~dp0"
echo Building Council web app...
call npm.cmd run export:web
if errorlevel 1 (
  echo.
  echo Web build failed.
  pause
  exit /b 1
)
echo.
echo Starting Council at http://localhost:8787
echo Do not open dist\index.html directly. Use the localhost URL.
start "Council Web Server" cmd /k "cd /d ""%~dp0"" && npm.cmd run app"
timeout /t 2 /nobreak >nul
start "" "http://localhost:8787"
