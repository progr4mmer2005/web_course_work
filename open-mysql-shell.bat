@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if not exist ".env" (
  echo [ERROR] .env file not found in: %~dp0
  pause
  exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
  if /I "%%A"=="DB_HOST" set "DB_HOST=%%B"
  if /I "%%A"=="DB_PORT" set "DB_PORT=%%B"
  if /I "%%A"=="DB_USER" set "DB_USER=%%B"
  if /I "%%A"=="DB_PASSWORD" set "DB_PASSWORD=%%B"
  if /I "%%A"=="DB_NAME" set "DB_NAME=%%B"
)

if not defined DB_HOST set "DB_HOST=127.0.0.1"
if not defined DB_PORT set "DB_PORT=3306"
if not defined DB_USER set "DB_USER=root"
if not defined DB_NAME set "DB_NAME=mysql"

where mysql >nul 2>nul
if errorlevel 1 (
  echo [ERROR] mysql client is not found in PATH.
  echo Install MySQL client or add mysql.exe to PATH.
  pause
  exit /b 1
)

set "MYSQL_PWD=%DB_PASSWORD%"

echo Connected to %DB_NAME% as %DB_USER%@%DB_HOST%:%DB_PORT%
echo Type SQL commands and press Enter.
echo Exit: \q
echo.

mysql -h "%DB_HOST%" -P "%DB_PORT%" -u "%DB_USER%" -D "%DB_NAME%"

if errorlevel 1 (
  echo.
  echo [ERROR] MySQL shell failed to start.
  pause
  exit /b 1
)
