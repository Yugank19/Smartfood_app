@echo off
echo ===================================================
echo   MealBridge - Starting Backend Only
echo   Database: Supabase PostgreSQL
echo ===================================================

echo [1/2] Loading secrets...
if exist secrets.bat (
    call secrets.bat
    echo     Secrets loaded.
) else (
    echo     WARNING: secrets.bat not found!
    echo     Set SUPABASE_DB_PASSWORD, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY manually.
)

echo.
echo [2/2] Clearing port 8080 if in use...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 " ^| findstr "LISTENING"') do (
    echo     Killing process %%a on port 8080...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Starting Spring Boot Backend...
cd /d %~dp0backEnd
mvn spring-boot:run
