@echo off
setlocal enabledelayedexpansion
title ContractIQ Startup Manager

echo ========================================================
echo               ContractIQ Quick Startup
echo ========================================================
echo.

set "PROJECT_ROOT=%~dp0"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"
set "BACKEND_DIR=%PROJECT_ROOT%backend"

:: Detect Python executable
set "PYTHON_EXE=python"
if exist "C:\Users\ved48\AppData\Local\Programs\Python\Python314\python.exe" (
    set "PYTHON_EXE=C:\Users\ved48\AppData\Local\Programs\Python\Python314\python.exe"
) else if exist "%PROJECT_ROOT%.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%PROJECT_ROOT%.venv\Scripts\python.exe"
)

:: 1. CHECK POSTGRESQL (Port 5432)
echo [1/4] Checking PostgreSQL status...
netstat -ano | findstr "LISTENING" | findstr ":5432" >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] PostgreSQL is already running on port 5432.
) else (
    echo   [INFO] Starting PostgreSQL service...
    sc query postgresql-x64-18 >nul 2>&1
    if %errorlevel% equ 0 (
        net start postgresql-x64-18 >nul 2>&1
    ) else (
        net start postgresql >nul 2>&1
    )
    ping 127.0.0.1 -n 3 >nul
    netstat -ano | findstr "LISTENING" | findstr ":5432" >nul 2>&1
    if %errorlevel% equ 0 (
        echo   [OK] PostgreSQL started successfully.
    ) else (
        echo   [WARNING] PostgreSQL port 5432 not detected.
    )
)

:: 2. CHECK BACKEND (Port 8000)
echo.
echo [2/4] Checking FastAPI Backend status...
netstat -ano | findstr "LISTENING" | findstr ":8000" >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Backend is already running on port 8000 - reusing existing process.
) else (
    echo   [INFO] Starting FastAPI Backend on port 8000 in separate window...
    start "ContractIQ Backend" /D "%BACKEND_DIR%" cmd /k %PYTHON_EXE% -m uvicorn app.main:app --host 127.0.0.1 --port 8000
)

:: 3. CHECK FRONTEND (Port 3000)
echo.
echo [3/4] Checking Next.js Frontend status...
netstat -ano | findstr "LISTENING" | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Frontend is already running on port 3000 - reusing existing process.
) else (
    echo   [INFO] Starting Next.js Frontend on port 3000 in separate window...
    start "ContractIQ Frontend" /D "%FRONTEND_DIR%" cmd /k npm run dev
)

:: 4. WAIT FOR READINESS
echo.
echo [4/4] Waiting for services to be ready...

:: Wait for Backend (Max 30s)
set /a BE_RETRIES=0
:WAIT_BACKEND
curl.exe -f -s -o NUL http://127.0.0.1:8000/docs >nul 2>&1
if not errorlevel 1 (
    echo   [OK] Backend API is ready at http://127.0.0.1:8000
    goto WAIT_FRONTEND_START
)
set /a BE_RETRIES+=1
if %BE_RETRIES% geq 30 (
    echo   [ERROR] Backend failed to respond within 30 seconds.
    echo   Please inspect the "ContractIQ Backend" terminal window for error logs.
    pause
    exit /b 1
)
ping 127.0.0.1 -n 2 >nul
goto WAIT_BACKEND

:WAIT_FRONTEND_START
set /a FE_RETRIES=0
:WAIT_FRONTEND
curl.exe -f -s -o NUL http://localhost:3000/ >nul 2>&1
if not errorlevel 1 (
    echo   [OK] Frontend UI is ready at http://localhost:3000
    goto LAUNCH_BROWSER
)
set /a FE_RETRIES+=1
if %FE_RETRIES% geq 30 (
    echo   [ERROR] Frontend failed to respond within 30 seconds.
    echo   Please inspect the "ContractIQ Frontend" terminal window for error logs.
    pause
    exit /b 1
)
ping 127.0.0.1 -n 2 >nul
goto WAIT_FRONTEND


:LAUNCH_BROWSER
echo.
echo ========================================================
echo   ContractIQ is live at: http://localhost:3000
echo   Demo Accounts:
echo     - Admin:            admin@gmail.com   / admin123
echo     - Contract Manager: manager@gmail.com / manager123
echo     - Viewer:           viewer@gmail.com  / viewer123
echo ========================================================
echo.
echo Opening default browser...
start http://localhost:3000/
echo Done! You can close this launcher window at any time.
