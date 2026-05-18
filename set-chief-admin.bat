@echo off
setlocal
cd /d "%~dp0"
node "scripts\chief-admin-cli.js"
if errorlevel 1 (
  echo.
  echo Script finished with error.
)
echo.
pause
