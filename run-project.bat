@echo off
echo ===================================================
echo   Smart Food Redistribution Platform - HarvestLink
echo ===================================================

echo [0/2] Clearing port 8080 if in use...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 " ^| findstr "LISTENING"') do (
    echo     Killing process %%a on port 8080...
    taskkill /PID %%a /F >nul 2>&1
)
echo     Port 8080 is free.

echo.
echo [1/2] Starting Spring Boot Backend...
start "HarvestLink Backend" cmd /k "cd /d %~dp0backEnd && mvn spring-boot:run"

echo.
echo [2/2] Waiting 5 seconds then starting React Frontend...
timeout /t 5 /nobreak >nul
start "HarvestLink Frontend" cmd /k "cd /d %~dp0frontEnd && npm start"

echo.
echo ===================================================
echo   Both services are starting:
echo   - Backend:  http://localhost:8080
echo   - Frontend: http://localhost:3000
echo ===================================================
echo.
echo   TIP: Check the Backend window for the OTP code
echo   if SMS is not received on your phone.
echo ===================================================
pause
