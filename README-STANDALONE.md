# AI Image Generator - STANDALONE
## No External APIs Required - Runs on Your Local GPU

This is a **completely standalone** AI Image Generator that produces Midjourney-standard quality images using local Stable Diffusion models. **No internet connection required after setup**, no API keys, no monthly fees.

---

## ✨ Features

### 🎨 Image Quality
- **Midjourney V6 Style** - Ultra-detailed, artistic, professional
- **8 Professional Style Presets** - Photorealistic, Digital Art, Anime, Cyberpunk, Fantasy, Oil Painting, Minimalist
- **Smart Prompt Enhancement** - Automatically improves your prompts
- **Local GPU Processing** - Fast generation on your hardware
- **No Internet Required** - Fully offline after setup

### 🖥️ System Requirements

#### Minimum Requirements
- **OS**: Windows 10/11, Linux, or macOS
- **RAM**: 16GB (32GB recommended)
- **Storage**: 20GB free space
- **GPU**: NVIDIA GTX 1060 6GB or better
- **Python**: 3.10 or newer

#### Recommended for Best Performance
- **GPU**: NVIDIA RTX 3060 12GB or better
- **RAM**: 32GB
- **Storage**: SSD with 50GB free

### 🔧 What's Included

This package contains:
- ✅ Complete backend with local Stable Diffusion
- ✅ Frontend React application
- ✅ Model download scripts
- ✅ Database with Prisma
- ✅ Credit system
- ✅ Authentication
- ✅ 8 professional style presets

---

## 🚀 Quick Start Guide

### Step 1: Install Prerequisites

#### Windows
```powershell
# Install Python 3.10+ from https://python.org
# Make sure to check "Add Python to PATH"

# Install Git from https://git-scm.com

# Install Node.js 18+ from https://nodejs.org
```

#### Linux/macOS
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip git nodejs npm

# macOS with Homebrew
brew install python3 git node
```

### Step 2: Download This Package

```bash
cd "AI Image Generator"
```

### Step 3: Run Setup

#### Windows
```powershell
.\setup-standalone.bat
```

#### Linux/macOS
```bash
bash setup-standalone.sh
```

This will:
1. Install Node.js dependencies
2. Check Python installation
3. Setup database
4. Download Stable Diffusion XL model (~7GB)

### Step 4: Start the System

```bash
# Terminal 1 - Start Backend
npm run dev

# Terminal 2 - Start Frontend
cd client
npm run dev
```

### Step 5: Access the App

Open http://localhost:5173 in your browser

---

## 📥 Model Downloads

The system needs at least one Stable Diffusion model. Choose from these options:

### Option 1: SDXL Base (Recommended for beginners)
- **Size**: 6.9 GB
- **Quality**: Good all-around performance
- **Speed**: Moderate
- **VRAM**: 8GB minimum

### Option 2: RealVisXL (Best for photorealism)
- **Size**: 6.9 GB
- **Quality**: Photorealistic portraits
- **Speed**: Moderate
- **VRAM**: 8GB minimum

### Option 3: Juggernaut XL (Best for art)
- **Size**: 6.9 GB
- **Quality**: Artistic, detailed
- **Speed**: Moderate
- **VRAM**: 8GB minimum

### Download via UI
1. Go to http://localhost:5173
2. Login or register
3. Click "System" → "Models"
4. Select model and click "Download"

### Download via Command Line
```bash
node scripts/download-model.js "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors" "sd_xl_base_1.0.safetensors"
```

---

## 🎨 How to Use

### Creating Your First Image

1. **Login or Register**
   - New users get 100 free credits
   - Each generation costs 1 credit

2. **Enter Your Prompt**
   ```
   Example: "a majestic lion in golden sunset light, detailed fur"
   ```

3. **Select Style Preset**
   - **Midjourney V6 Style** - Best overall quality
   - **Photorealistic** - For realistic photos
   - **Digital Art** - For artistic illustrations

4. **Enable "Enhance Prompt"**
   - Automatically adds professional keywords
   - Improves lighting and detail
   - Adds negative prompts

5. **Click "Generate"**
   - Wait 30-120 seconds (depends on GPU)
   - Image appears in the gallery

6. **Download or Share**
   - Click to view full size
   - Download as PNG

---

## 🎯 Prompt Engineering Tips

### Basic Structure
```
[Subject] + [Details] + [Style] + [Quality Keywords]
```

### Example Prompts

**Portrait**
```
portrait of a young woman, flowing red hair, golden hour lighting, bokeh background, sharp focus, professional photography
```

**Landscape**
```
serene mountain lake at sunrise, mist rising, reflection in water, pine trees, ultra detailed, 8k, landscape photography
```

**Fantasy**
```
elven castle floating in clouds, waterfalls, magical atmosphere, rainbow, fantasy art, highly detailed
```

**Cyberpunk**
```
cyberpunk street at night, neon signs, rain on pavement, futuristic motorcycle, blade runner aesthetic, neon lights
```

---

## 🔧 Troubleshooting

### "Python not found"
**Solution**: Install Python 3.10+ and make sure it's in your PATH

### "CUDA out of memory"
**Solution**: Your GPU doesn't have enough VRAM
- Try smaller image size (512x512 instead of 1024x1024)
- Close other applications using GPU
- Use a model with less VRAM requirements

### "Model download failed"
**Solution**: 
- Check internet connection
- Try downloading manually from HuggingFace
- Place .safetensors file in `stable-diffusion/models/Stable-diffusion/`

### "Generation is slow"
**Solutions**:
- First generation is always slower (model loading)
- Enable xformers: `pip install xformers`
- Use a faster GPU
- Reduce image size or steps

### "No module named 'torch'"
**Solution**: Install PyTorch
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

---

## 💻 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                           │
│                  (React + Tailwind)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/WebSocket
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS BACKEND                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Auth      │  │  Generation │  │   Model Manager     │  │
│  │  (JWT)      │  │   Queue     │  │  (Download/Load)    │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────────┘  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼ Python Scripts
┌─────────────────────────────────────────────────────────────┐
│              STABLE DIFFUSION PIPELINE                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Model: SDXL / RealVisXL / JuggernautXL               │  │
│  │  Sampler: DPM++ 2M Karras / Euler a                   │  │
│  │  Steps: 30-40                                         │  │
│  │  CFG: 7.0-8.0                                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  GPU (CUDA)  │
                    │  Local Gen   │
                    └──────────────┘
```

---

## 📊 Performance Benchmarks

| GPU | Resolution | Steps | Time |
|-----|-----------|-------|------|
| RTX 4090 (24GB) | 1024x1024 | 40 | ~8s |
| RTX 3090 (24GB) | 1024x1024 | 40 | ~12s |
| RTX 3060 (12GB) | 1024x1024 | 40 | ~25s |
| GTX 1080 Ti (11GB) | 1024x1024 | 40 | ~45s |
| RTX 3060 (12GB) | 512x512 | 30 | ~8s |

*Times are approximate and vary by prompt complexity*

---

## 🎓 Advanced Configuration

### Custom Model Path
Edit `src/index.ts`:
```typescript
const MODEL_PATH = '/path/to/your/model.safetensors';
```

### Custom Sampler Settings
Edit style preset in `src/index.ts`:
```typescript
{
  sampler: 'DPM++ 2M Karras',
  steps: 50,
  cfgScale: 8.5
}
```

### Enable Faster Generation
Install xformers:
```bash
pip install xformers
```

---

## 🔒 Privacy & Security

✅ **100% Private** - All images generated locally on your machine
✅ **No Data Sent** - No prompts or images sent to external servers
✅ **Local Storage** - Images stored on your hard drive only
✅ **Offline Capable** - Works without internet after setup

---

## 📝 License

MIT License - Free for personal and commercial use

You can:
- ✅ Use for commercial projects
- ✅ Modify the code
- ✅ Distribute your modifications
- ✅ Use privately

You must:
- Include the license file

---

## 🆘 Getting Help

### Common Issues
Check the **Troubleshooting** section above

### System Requirements
Make sure you meet the **minimum requirements**

### Model Downloads
Download models from [HuggingFace](https://huggingface.co/models?pipeline_tag=text-to-image)

### Community
- Stable Diffusion: https://github.com/AUTOMATIC1111/stable-diffusion-webui
- Models: https://civitai.com

---

## 🎉 Ready to Create!

Your standalone AI Image Generator is ready. Start creating stunning, Midjourney-quality images without any external APIs or subscriptions!

**Start the app and go to http://localhost:5173**

Happy creating! 🎨✨
