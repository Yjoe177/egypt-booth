@echo off
title Egypt Booth - keep this window open!
cd /d "%~dp0"
echo.
echo   ==========================================
echo      EGYPT BOOTH  -  Ahlan wa Sahlan!
echo   ==========================================
echo.
echo   The games are starting in your browser...
echo   KEEP THIS BLACK WINDOW OPEN while the booth is running.
echo   (Close it at the end of the day.)
echo.
start "" cmd /c "timeout /t 2 /nobreak >nul & start "" http://localhost:8080/"
python -m http.server 8080 --bind 127.0.0.1
if errorlevel 1 (
  echo Trying "py" instead of "python"...
  py -m http.server 8080 --bind 127.0.0.1
)
echo.
echo Python was not found. Install it from https://www.python.org/downloads/ (tick "Add to PATH").
pause
