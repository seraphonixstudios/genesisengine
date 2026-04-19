@echo off
REM AI Image Generator - One-Click Deployment (Windows Batch)
REM Double-click this file to deploy to VPS

echo ==============================================
echo   AI Image Generator - One-Click Deploy
echo ==============================================
echo.
echo This will deploy to: 76.13.242.128
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: PowerShell is required but not found.
    pause
    exit /b 1
)

REM Run the PowerShell script
echo Starting deployment...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0deploy-one-click.ps1"

if %errorlevel% neq 0 (
    echo.
    echo DEPLOYMENT FAILED
    echo Check the error messages above.
    pause
    exit /b 1
)

echo.
pause
