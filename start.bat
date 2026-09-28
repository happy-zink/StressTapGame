@echo off
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
  python serve.py
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  py -3 serve.py
  goto :eof
)

where python3 >nul 2>nul
if %errorlevel%==0 (
  python3 serve.py
  goto :eof
)

echo [ERROR] Python not found. Install Python 3 or open index.html directly in a browser.
echo Note: opening index.html via file:// works for most features in modern Chrome/Edge.
pause
