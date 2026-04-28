@echo off
echo ===================================================
echo   Smart Food Redistribution Platform - MealBridge
echo   Database: Supabase PostgreSQL
echo   Auth:     Supabase Phone OTP + PIN
echo ===================================================

echo [0/2] Clearing port 8080 if in use...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 " ^| findstr "LISTENING"') do (
    echo     Killing process %%a on port 8080...
    taskkill /PID %%a /F >nul 2>&1
)
echo     Port 8080 is free.

echo.
echo [1/2] Starting Spring Boot Backend (Supabase PostgreSQL)...
if exist secrets.bat call secrets.bat
start "MealBridge Backend" cmd /k "cd /d %~dp0backEnd && mvn spring-boot:run"

echo.
echo [2/2] Waiting 8 seconds then starting React Frontend...
timeout /t 8 /nobreak >nul
start "MealBridge Frontend" cmd /k "cd /d %~dp0frontEnd && npm start"

echo.
echo ===================================================
echo   Both services are starting:
echo   - Backend:  http://localhost:8080
echo   - Frontend: http://localhost:3000
echo   - Supabase: https://zubirjxjmjvmpyezmyzg.supabase.co
echo ===================================================
echo.
echo   FIRST TIME SETUP:
echo   1. Go to Supabase Dashboard ^> Authentication ^> Providers
echo   2. Enable "Phone" provider (Twilio or Supabase built-in)
echo   3. Go to Storage ^> Create bucket "food-images" (Public)
echo   4. Run: cd frontEnd ^&^& npm install
echo ===================================================
pause
