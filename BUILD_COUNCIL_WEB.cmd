@echo off
cd /d "%~dp0"
echo Building Council web export...
call npm.cmd run export:web
if errorlevel 1 (
  echo.
  echo Web build failed.
  pause
  exit /b 1
)
echo.
echo Build completed. Run START_COUNCIL_WEB.cmd and open http://localhost:8787
pause
