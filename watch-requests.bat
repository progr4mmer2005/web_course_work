@echo off
title Request Watcher

cd /d "%~dp0"

if not exist "logs" mkdir logs
if not exist "logs\requests.log" type nul > "logs\requests.log"

echo.
echo  HTTP Request Watcher
echo  File: %~dp0logs\requests.log
echo  Run server separately (npm run dev)
echo  Press Ctrl+C to stop
echo.
echo -------------------------------------------
echo.

powershell -Command "Get-Content '%~dp0logs\requests.log' -Wait"
