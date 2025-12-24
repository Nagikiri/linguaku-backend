@echo off
echo ====================================
echo   LinguaKu - Quick Start Script
echo ====================================
echo.

REM Check if backend is running
echo [1/4] Checking Backend...
curl -s http://localhost:5000/api/materials >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Backend not running on port 5000
    echo Please start backend: cd Backendnya ^&^& npm start
    echo.
) else (
    echo ✓ Backend is running
    echo.
)

REM Check if Python AI is running
echo [2/4] Checking Python AI Service...
curl -s http://localhost:7000 >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Python AI not running on port 7000
    echo Please start AI: cd Backendnya\AIConnector ^&^& python ai_service.py
    echo.
) else (
    echo ✓ Python AI is running
    echo.
)

REM Clear cache
echo [3/4] Clearing cache...
if exist .expo rmdir /s /q .expo
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo ✓ Cache cleared
echo.

REM Start Expo
echo [4/4] Starting Expo...
echo.
echo ====================================
echo   Scan QR code with Expo Go app
echo   Make sure HP and PC on same WiFi
echo ====================================
echo.

npx expo start --clear
