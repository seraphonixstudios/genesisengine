@echo off
echo ==========================================
echo AI Image Generator Pro - Setup Script
echo ==========================================
echo.

REM Check if running in correct directory
if not exist "package.json" (
    echo ERROR: Please run this script from the AI Image Generator directory
    exit /b 1
)

echo Step 1: Cleaning old dependencies...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul
cd client
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul
cd ..
echo Done!
echo.

echo Step 2: Installing backend dependencies...
npm install
if errorlevel 1 (
    echo ERROR: Backend npm install failed
    exit /b 1
)
echo Done!
echo.

echo Step 3: Installing frontend dependencies...
cd client
npm install
if errorlevel 1 (
    echo ERROR: Frontend npm install failed
    exit /b 1
)
cd ..
echo Done!
echo.

echo Step 4: Checking environment file...
if not exist ".env" (
    echo Creating .env file from template...
    echo # Database > .env
    echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_image_generator" >> .env
    echo JWT_SECRET="change-this-to-a-secure-secret-key" >> .env
    echo. >> .env
    echo # AI Providers (add at least one) >> .env
    echo LEONARDO_API_KEY="" >> .env
    echo OPENAI_API_KEY="" >> .env
    echo REPLICATE_API_TOKEN="" >> .env
    echo. >> .env
    echo ✅ .env file created!
    echo Please edit .env and add your API keys before starting
) else (
    echo .env file already exists
)
echo.

echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Edit .env file and add your API keys
echo 2. Start PostgreSQL: docker-compose up -d postgres
echo 3. Run migrations: npx prisma migrate dev --name init
echo 4. Start backend: npx tsx src/index.ts
echo 5. Start frontend: cd client ^&^& npm run dev
echo.
echo Get API keys:
echo - Leonardo AI: https://leonardo.ai (Recommended - Best quality)
echo - OpenAI: https://platform.openai.com
echo - Replicate: https://replicate.com
echo.
pause
