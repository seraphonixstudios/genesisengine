# 🌟 Genesis Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Socket.io-orange.svg)](https://socket.io/)

> **"In the beginning, there was the prompt."**

**Genesis Engine** is a professional-grade AI image generation platform that transforms creative visions into reality. Named after the ultimate act of creation, we empower artists, designers, and dreamers to bring their ideas to life with Midjourney-level quality—20 free generations per day, no credit card required.

<p align="center">
  <img src="docs/images/seraphonix-logo.png" alt="Seraphonix Studios" width="200"/>
</p>

<p align="center">
  <em>Created by</em> <strong>Seraphonix Studios</strong> <em>•</em> <img src="docs/images/sovereign-logo.png" alt="Sovereign" width="30" style="vertical-align: middle"/> <em>Powered by Sovereign</em>
</p>

![Genesis Engine Demo](docs/images/demo-banner.png)

## 🌟 The Story Behind Genesis Engine

The name "Genesis" represents the ultimate act of creation—the moment when possibility becomes reality. Just as the biblical Genesis describes the birth of the universe from void, our engine transforms the empty canvas of imagination into tangible, stunning visuals.

**Our Philosophy:**
- **Creation from Nothing** → Transform text prompts into visual art
- **Seven Modes of Creation** → Seven distinct generation capabilities
- **Let There Be Light** → Illuminating ideas through AI
- **It Was Good** → Quality that exceeds expectations

## 🎨 What Makes Genesis Engine Different

### The Genesis Difference

| Feature | Genesis Engine | Midjourney | DALL-E 3 | Stable Diffusion |
|---------|----------------|------------|----------|------------------|
| **Free Generations** | ✅ 20/day | ❌ Paid only | ❌ Paid only | ✅ Unlimited (local) |
| **Multi-Provider** | ✅ 4 providers | ❌ Single | ❌ Single | ❌ Single |
| **Image-to-Image** | ✅ | ❌ | ❌ | ✅ |
| **Inpainting** | ✅ | ❌ | ❌ | ✅ |
| **Upscaling** | ✅ Built-in | ❌ | ❌ | ❌ Manual |
| **ControlNet** | ✅ | ❌ | ❌ | ✅ |
| **Batch Generation** | ✅ | ✅ | ❌ | ❌ |
| **Open Source** | ✅ | ❌ | ❌ | ✅ |
| **WebSocket Progress** | ✅ Real-time | ❌ | ❌ | ❌ |
| **Self-Hostable** | ✅ | ❌ | ❌ | ✅ |

**Genesis Engine combines the best of all worlds.**

## 🚀 Features Overview

### 🎨 **Seven Modes of Creation**

The Genesis Engine provides seven distinct ways to create, just as creation itself unfolds through multiple dimensions:

1. **Text-to-Image (The Word)** - "Let there be light" — Transform words into stunning visuals
2. **Image-to-Image (Transformation)** - Reshape existing creations into new forms
3. **Inpainting (Healing)** - Restore and modify specific regions seamlessly
4. **Outpainting (Expansion)** - Extend the boundaries of your canvas
5. **Upscaling (Magnification)** - Enhance resolution while preserving detail
6. **ControlNet (Precision)** - Guide creation with pose, depth, and edges
7. **Batch Generation (Multiplication)** - Create variations simultaneously

### 🤖 **Four Pillars of AI Power**

Our engine draws strength from four mighty AI providers:

| Provider | Free Tier | Genesis Advantage |
|----------|-----------|-------------------|
| **HuggingFace** | ✅ Unlimited | Community-driven models |
| **Replicate** | ✅ 50/day | Cloud GPU power |
| **Stability AI** | ❌ Commercial | Enterprise-grade quality |
| **OpenAI** | ❌ Premium | Best-in-class DALL-E 3 |

**The Genesis Engine automatically selects the best provider for your needs.**

### ✨ **The Genesis Enhancement Protocol**

Our proprietary prompt enhancement system elevates simple descriptions into professional-grade prompts:

**Before:** "a cat sitting on a chair"

**After Genesis Enhancement:** 
> "masterpiece, best quality, ultra-detailed, professional photography, 8k uhd, a majestic cat sitting gracefully on an ornate Victorian chair, dramatic lighting, sharp focus, dslr, detailed fur texture, natural lighting, symmetrical composition, award-winning photography, trending on artstation"

**Styles of Creation:**
- 🎨 **Photorealistic** - Professional photography
- 🎭 **Digital Art** - ArtStation trending style  
- 🎌 **Anime** - Japanese animation aesthetics
- 🎬 **Cinematic** - Movie still quality
- 🖼️ **Oil Painting** - Classical fine art
- 🎲 **3D Render** - Octane/Unreal Engine
- 🐉 **Fantasy** - Epic magical scenes
- 🌃 **Cyberpunk** - Neon dystopian future

### 💰 **20 Free Generations Per Day**

**No credit card. No subscription. Just create.**

- ✅ 20 high-quality generations every day
- 🕛 Resets at midnight UTC
- 📊 Real-time counter in the interface
- ⬆️ Upgrade available for unlimited access

## 🚀 Quick Start: Your First Creation (3 Minutes)

### Prerequisites
- Node.js 18+ 
- npm or yarn
- 500MB free disk space

### 1. Clone & Install

```bash
# Clone the Genesis Engine repository
git clone https://github.com/yourusername/genesis-engine.git
cd genesis-engine

# Install server dependencies
cd server
npm install

# Install client dependencies  
cd ../client
npm install
```

### 2. Configure Environment

Create `.env` file in `/server` directory:

```bash
cd ../server
cp .env.example .env
```

Edit `.env`:
```env
# Required (for free generations)
HUGGINGFACE_API_KEY=your_huggingface_token_here

# Optional (for more power)
REPLICATE_API_TOKEN=your_replicate_token_here
STABILITY_API_KEY=your_stability_key_here
OPENAI_API_KEY=your_openai_key_here

# Security
JWT_SECRET=genesis-engine-secret-key-min-32-chars

# Server settings
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Get free API keys:**
- HuggingFace: https://huggingface.co/settings/tokens (Free)
- Replicate: https://replicate.com/account/api-tokens (Free tier)

### 3. Ignite the Engine

```bash
# Terminal 1 - Start the Genesis Engine backend
cd server
npm start

# Terminal 2 - Start the interface
cd client
npm run dev
```

### 4. Begin Creation

Navigate to: **http://localhost:5173**

**Demo Credentials:**
- Email: `demo@example.com`
- Password: `demo123`

## 📖 Genesis Documentation

### Table of Contents
- [Quick Start](#-quick-start-your-first-creation-3-minutes)
- [Features](#-features-overview)
- [API Documentation](#-api-documentation)
- [Architecture](#-architecture)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

## 🔌 Genesis API

### Authentication Endpoints

#### Register (Create Your Genesis Account)
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Creator Name",
  "email": "creator@example.com",
  "password": "securepassword123"
}

# Response - Welcome to Genesis
{
  "success": true,
  "message": "Welcome to Genesis Engine",
  "user": {
    "id": "genesis-user-uuid",
    "email": "creator@example.com",
    "name": "Creator Name",
    "credits": 100,
    "plan": "free",
    "dailyCreations": {
      "count": 0,
      "limit": 20,
      "remaining": 20,
      "resetAt": "2026-01-20T00:00:00Z"
    }
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login (Return to Genesis)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "demo@example.com",
  "password": "demo123"
}
```

### The Seven Creation Endpoints

#### 1. Text-to-Image (The Word)
```http
POST /api/generate/txt2img
Authorization: Bearer {genesis-token}
Content-Type: application/json

{
  "prompt": "a serene mountain landscape at sunset",
  "provider": "huggingface",
  "model": "stabilityai/stable-diffusion-xl-base-1.0",
  "style": "photorealistic",
  "quality": "high",
  "enhance": true,
  "width": 1024,
  "height": 1024
}
```

#### 2. Image-to-Image (Transformation)
```http
POST /api/generate/img2img
Authorization: Bearer {genesis-token}
Content-Type: multipart/form-data

image: <your-image-file>
prompt: "convert to oil painting style"
strength: 0.7
style: "oil-painting"
provider: "stability"
```

#### 3. Inpainting (Healing)
```http
POST /api/generate/inpaint
Authorization: Bearer {genesis-token}
Content-Type: multipart/form-data

image: <original-image>
mask: <mask-image>
prompt: "replace with crystal clear water"
```

#### 4. Outpainting (Expansion)
```http
POST /api/generate/outpaint
Authorization: Bearer {genesis-token}
Content-Type: multipart/form-data

image: <original-image>
prompt: "extend with starry night sky"
width: 1536
height: 1536
```

#### 5. Upscaling (Magnification)
```http
POST /api/generate/upscale
Authorization: Bearer {genesis-token}
Content-Type: multipart/form-data

image: <image-to-enhance>
scale: 4
faceEnhance: true
```

#### 6. ControlNet (Precision)
```http
POST /api/generate/controlnet
Authorization: Bearer {genesis-token}
Content-Type: multipart/form-data

controlImage: <pose-or-depth-image>
controlType: "pose"
prompt: "warrior in battle stance"
controlScale: 1.0
```

#### 7. Batch Generation (Multiplication)
```http
POST /api/generate/batch
Authorization: Bearer {genesis-token}
Content-Type: application/json

{
  "prompts": [
    "sunset over ocean",
    "mountain landscape", 
    "city skyline at night",
    "forest path"
  ],
  "provider": "huggingface",
  "style": "digital-art"
}
```

### The Genesis Enhancement Protocol
```http
POST /api/generate/enhance-prompt
Content-Type: application/json

{
  "prompt": "a cat sitting on a chair",
  "style": "photorealistic",
  "quality": "high",
  "variations": true,
  "variationCount": 4
}

# Response
{
  "success": true,
  "original": "a cat sitting on a chair",
  "enhanced": "masterpiece, best quality, ultra-detailed, photorealistic...",
  "negativePrompt": "painting, drawing, illustration, cartoon, anime...",
  "variations": [
    "... from above",
    "... golden hour lighting", 
    "... close-up portrait"
  ]
}
```

### Daily Creation Limit Status
```http
GET /api/me
Authorization: Bearer {genesis-token}

# Response
{
  "id": "genesis-user-id",
  "email": "creator@example.com",
  "name": "Creator",
  "dailyCreations": {
    "count": 15,
    "limit": 20,
    "remaining": 5,
    "resetAt": "2026-01-20T00:00:00Z",
    "hoursUntilReset": 8
  }
}
```

## 🏗️ Genesis Architecture

### The Genesis Blueprint

```
┌─────────────────────────────────────────────────────────────┐
│                     The Interface Layer                      │
│                    (React 18 + TypeScript)                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Seven Creation Modes + Real-time Progress Updates    │  │
│  │         Connected via WebSocket to the Engine         │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────────┬───────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────┐
│                     The Genesis Engine                         │
│                  (Node.js + Express Core)                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Authentication • Rate Limiting • Job Queue • WebSocket   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                  │
│  ┌─────────────────────────┴─────────────────────────────┐   │
│  │           Four Pillars of AI Creation                   │   │
│  │  HuggingFace • Replicate • Stability AI • OpenAI      │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

## 📦 Project Structure

```
genesis-engine/
├── 🖥️ server/              # The Genesis Engine Core
│   ├── server.js          # Main engine entry point
│   ├── routes/            # Seven creation endpoints
│   ├── utils/           # Genesis utilities
│   └── middleware/      # Engine guards
│
├── 🎨 client/              # The Interface
│   ├── src/
│   │   ├── components/  # Creation interface
│   │   └── styles/      # Visual design
│   └── public/         # Static assets
│
├── 📚 docs/               # Genesis Documentation
│   ├── WHITE_PAPER.md   # Technical deep dive
│   └── API_REFERENCE.md # Complete API docs
│
└── 🔧 .github/           # Genesis Governance
    └── workflows/        # CI/CD automation
```

## 🚀 Deploy Your Genesis Engine

### Deploy to Render (Free Tier Available)

```bash
# 1. Fork to your GitHub
# 2. Connect to Render
# 3. Deploy automatically on every push
```

**Environment Variables for Render:**
```
HUGGINGFACE_API_KEY=your-key
JWT_SECRET=genesis-production-secret
NODE_ENV=production
```

### Deploy to Railway

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### Self-Host with Docker

```dockerfile
# Dockerfile included in repository
# Build and run your own Genesis Engine
```

## 🤝 Contributing to Genesis

We welcome creators, developers, and dreamers to contribute to Genesis Engine.

### The Genesis Contributors' Covenant

1. **Be Creative** → Add new creation modes
2. **Be Technical** → Improve the engine core  
3. **Be Helpful** → Enhance documentation
4. **Be Respectful** → Follow our Code of Conduct

**Priority Creation Areas:**
- 🎬 Video generation from prompts
- 🎵 Audio-reactive visualizations
- 🔮 VR/AR preview modes
- 🌐 Real-time collaboration

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the full covenant.

## 🐛 Genesis Troubleshooting

### "Daily creation limit reached"
```
The 20 free generations have been used.
Solution: Wait for UTC midnight reset, or upgrade to Pro
```

### "API pillar not responding"
```
One of the four AI providers is experiencing issues.
Solution: Genesis Engine will auto-fallback to next provider
```

### "WebSocket connection severed"
```
Real-time updates are unavailable.
Solution: Check network, refresh page, verify CORS settings
```

## 📜 The Genesis License

**MIT License** - See [LICENSE](LICENSE)

**You are free to:**
- ✅ Use Genesis Engine commercially
- ✅ Modify and distribute
- ✅ Create derivative works
- ✅ Use privately

**Under the conditions:**
- Include copyright notice
- Include license text

## 🙏 Acknowledgments & Pillars of Support

**The Four Providers:**
- **Stability AI** - For Stable Diffusion, the foundation stone
- **Hugging Face** - For democratizing AI access
- **OpenAI** - For DALL-E, the pinnacle of quality
- **Replicate** - For cloud GPU accessibility

**The Genesis Community:**
- Contributors who expand our creation capabilities
- Users who bring their visions to life
- Open source advocates who believe in shared knowledge

## 🌟 Genesis Star History

[![Star History](https://api.star-history.com/svg?repos=yourusername/genesis-engine&type=Date)](https://star-history.com/#yourusername/genesis-engine&Date)

---

<div align="center">

**[⬆ Back to Top](#-genesis-engine)**

### *"And God said, 'Let there be light,' and there was light. And God saw that it was good."*

### Genesis 1:3-4

**[Launch Genesis Engine](https://genesis-engine.vercel.app)** • **[Documentation](https://docs.genesis-engine.com)** • **[API](https://api.genesis-engine.com)**

Built with 💫 by creators, for creators

</div>
