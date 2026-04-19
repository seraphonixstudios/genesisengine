#!/bin/bash

echo "============================================"
echo "AI Image Generator - Standalone Setup"
echo "No External APIs Required"
echo "============================================"
echo ""
echo "This will install everything needed to run"
echo "Stable Diffusion locally on your GPU."
echo ""
echo "Requirements:"
echo "- Python 3.10+ (with pip)"
echo "- Git"
echo "- Node.js 18+"
echo "- NVIDIA GPU with 6GB+ VRAM (recommended)"
echo "- 20GB free disk space"
echo ""
read -p "Press Enter to continue..."

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "ERROR: Please run this script from the AI Image Generator folder"
    exit 1
fi

echo ""
echo "[1/7] Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 not found. Please install Python 3.10+"
    echo "Ubuntu/Debian: sudo apt install python3 python3-pip"
    echo "macOS: brew install python3"
    exit 1
fi
echo "OK: Python found"

echo ""
echo "[2/7] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "OK: Node.js found"

echo ""
echo "[3/7] Cleaning old installations..."
rm -rf node_modules package-lock.json
cd client
rm -rf node_modules package-lock.json
cd ..
echo "Done!"

echo ""
echo "[4/7] Installing backend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Backend npm install failed"
    exit 1
fi
echo "Done!"

echo ""
echo "[5/7] Installing frontend dependencies..."
cd client
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend npm install failed"
    cd ..
    exit 1
fi
cd ..
echo "Done!"

echo ""
echo "[6/7] Setting up database..."
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_image_generator"
JWT_SECRET="change-this-to-a-secure-random-string-minimum-32-characters"

# Local Mode - No external APIs needed
LOCAL_MODE=true
EOF
    echo "Created .env file"
else
    echo ".env file already exists"
fi

echo ""
echo "Checking for PostgreSQL..."
if command -v docker &> /dev/null; then
    echo "Starting PostgreSQL container..."
    docker-compose up -d postgres
    echo "Waiting for database to start..."
    sleep 5
    
    echo "Running database migrations..."
    npx prisma generate
    npx prisma migrate dev --name init
    echo "Database ready!"
else
    echo "WARNING: Docker not found."
    echo "Please install PostgreSQL manually:"
    echo "Ubuntu: sudo apt install postgresql"
    echo "macOS: brew install postgresql"
fi

echo ""
echo "[7/7] Installing Python dependencies for Stable Diffusion..."
python3 -m pip install --upgrade pip

# Check for CUDA
echo "Checking for NVIDIA GPU..."
if command -v nvidia-smi &> /dev/null; then
    echo "NVIDIA GPU detected! Installing CUDA-enabled PyTorch..."
    python3 -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
else
    echo "WARNING: NVIDIA GPU not detected. CPU mode will be used (slower)"
    python3 -m pip install torch torchvision torchaudio
fi

echo "Installing other dependencies..."
python3 -m pip install diffusers transformers accelerate safetensors

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Download a Stable Diffusion model:"
echo "   - Start the app and go to System > Models"
echo "   - Or download manually from:"
echo "     https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0"
echo ""
echo "2. Start the application:"
echo "   - Terminal 1: npm run dev"
echo "   - Terminal 2: cd client && npm run dev"
echo ""
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "4. Register an account and start generating!"
echo ""
echo "Note: First generation will take longer as the model loads."
echo "Subsequent generations will be faster."
echo ""
read -p "Press Enter to exit..."
