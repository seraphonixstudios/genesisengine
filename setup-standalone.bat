@echo off
echo ============================================
echo AI Image Generator - Standalone Setup
echo No External APIs Required
echo ============================================
echo.
echo This will install everything needed to run
echo Stable Diffusion locally on your GPU.
echo.
echo Requirements:
echo - Python 3.10+ (with pip)
echo - Git
echo - Node.js 18+
echo - NVIDIA GPU with 6GB+ VRAM
echo - 20GB free disk space
echo.
pause

REM Check if in correct directory
if not exist "package.json" (
    echo ERROR: Please run this script from the AI Image Generator folder
echo.
pause
    exit /b 1
)

echo.
echo [1/7] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.10+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)
echo OK: Python found

echo.
echo [2/7] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install from https://nodejs.org
    pause
    exit /b 1
)
echo OK: Node.js found

echo.
echo [3/7] Cleaning old installations...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul
cd client
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul
cd ..
echo Done!

echo.
echo [4/7] Installing backend dependencies...
npm install
if errorlevel 1 (
    echo ERROR: Backend npm install failed
    pause
    exit /b 1
)
echo Done!

echo.
echo [5/7] Installing frontend dependencies...
cd client
npm install
if errorlevel 1 (
    echo ERROR: Frontend npm install failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo Done!

echo.
echo [6/7] Setting up database...
if not exist ".env" (
    echo Creating .env file...
    (
        echo # Database
        echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_image_generator"
        echo JWT_SECRET="change-this-to-a-secure-random-string-minimum-32-characters"
        echo.
        echo # Local Mode - No external APIs needed
        echo LOCAL_MODE=true
    ) > .env
    echo Created .env file
) else (
    echo .env file already exists
)

echo.
echo Checking for PostgreSQL...
docker ps >nul 2>&1
if errorlevel 1 (
    echo WARNING: Docker not found. Please install Docker Desktop
    echo from https://docker.com/products/docker-desktop
    echo.
    echo Alternative: Install PostgreSQL manually from
    echo https://postgresql.org/download/
) else (
    echo Starting PostgreSQL container...
    docker-compose up -d postgres
    echo Waiting for database to start...
    timeout /t 5 /nobreak >nul
    
    echo Running database migrations...
    npx prisma generate
    npx prisma migrate dev --name init
    echo Database ready!
)

echo.
echo [7/7] Installing Python dependencies for Stable Diffusion...
echo This will install PyTorch and required libraries...
echo.
python -m pip install --upgrade pip

REM Check for CUDA
echo Checking for NVIDIA GPU and CUDA...
nvidia-smi >nul 2>&1
if errorlevel 1 (
    echo WARNING: NVIDIA GPU not detected or drivers not installed
    echo CPU mode will be used ^(much slower^)
    echo.
    echo Install PyTorch for CPU:
    python -m pip install torch torchvision torchaudio
) else (
    echo NVIDIA GPU detected! Installing CUDA-enabled PyTorch...
    python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
)

echo Installing other dependencies...
python -m pip install diffusers transformers accelerate safetensors

echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo Next steps:
echo.
echo 1. Download a Stable Diffusion model:
echo    - Start the app and go to System ^> Models
echo    - Or download manually from:
echo      https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0
echo.
echo 2. Start the application:
echo    - Terminal 1: npm run dev
echo    - Terminal 2: cd client ^&^& npm run dev
echo.
echo 3. Open http://localhost:5173 in your browser
echo.
echo 4. Register an account and start generating!
echo.
echo Note: First generation will take longer as the model loads.
echo Subsequent generations will be faster.
echo.
pause
