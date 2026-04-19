# 🎨 AI Image Generator v3.0 - CYBERPUNK EDITION

## 🚀 **DEPLOYMENT INSTRUCTIONS**

### Step 1: Deploy the New Backend

```bash
ssh root@76.13.242.128
cd /var/www/ai-generator

# Backup current
mv server server-backup-old
mkdir -p server/uploads server/temp

# Deploy new server
cat > server/server.js << 'SERVEREND'
[paste the server-cyberpunk.js content here]
SERVEREND

# Install dependencies
npm install

# Restart backend
pm2 restart all
```

### Step 2: Deploy the New Frontend

```bash
cd /var/www/ai-generator/client

# Install react-dropzone if not present
npm install react-dropzone

# Copy the new files
cat > src/App.js << 'APPEND'
[paste the App-cyberpunk.js content here]
APPEND

cat > src/cyberpunk-atlantean.css << 'CSSEND'
[paste the CSS content here]
CSSEND

cat > src/index.js << 'INDEXEND'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './cyberpunk-atlantean.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
INDEXEND

# Build
npm run build

# Copy to dist
rm -rf dist
mkdir -p dist
cp -r build/* dist/

# Restart frontend
pkill -f 'serve.*3000' || true
sleep 2
cd dist
nohup npx serve -s . -l tcp://0.0.0.0:3000 > /var/www/ai-generator/logs/frontend.log 2>&1 &
```

---

## 🔑 **API KEY SETUP GUIDE**

### **Option 1: Hugging Face (FREE)** ⭐ RECOMMENDED

1. Go to https://huggingface.co/settings/tokens
2. Click "New token"
3. Name: "AI Image Generator"
4. Role: "read" 
5. Click "Generate token"
6. Copy the token (starts with `hf_`)

**Set it on your VPS:**
```bash
ssh root@76.13.242.128
nano /var/www/ai-generator/.env
```

Add this line:
```env
HUGGINGFACE_API_KEY=hf_your_token_here
```

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

Restart:
```bash
pm2 restart all
```

---

### **Option 2: Replicate**

1. Go to https://replicate.com/account/api-tokens
2. Click "Create a new token"
3. Name: "AI Image Generator"
4. Copy the token (starts with `r8_`)

**Set it on your VPS:**
```bash
ssh root@76.13.242.128
nano /var/www/ai-generator/.env
```

Add this line:
```env
REPLICATE_API_TOKEN=r8_your_token_here
```

Save and restart:
```bash
pm2 restart all
```

---

### **Option 3: OpenAI DALL-E**

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name: "AI Image Generator"
4. Copy the key (starts with `sk-`)

**Set it on your VPS:**
```bash
ssh root@76.13.242.128
nano /var/www/ai-generator/.env
```

Add this line:
```env
OPENAI_API_KEY=sk-your_key_here
```

Save and restart:
```bash
pm2 restart all
```

---

## 🎨 **WHAT'S NEW IN v3.0 CYBERPUNK EDITION**

### Visual Style
- **Cyberpunk/Matrix Theme**: Green digital rain background
- **Glitch Effects**: Animated glitch text on title
- **Neon Glows**: Cyan/magenta color scheme
- **Max Headroom Retro**: 80s scan lines and effects
- **Atlantean Accents**: Teal highlights

### Features
- ✅ **6 Tabs**: Generate, Advanced, Edit, Gallery, Workspace, System
- ✅ **10 Style Presets**: Cyberpunk, Matrix, Atlantean, Max Headroom, Vaporwave, Steampunk, Fantasy, Sci-Fi, Retro, Horror
- ✅ **3 AI Providers**: Hugging Face, OpenAI, Replicate
- ✅ **Advanced Controls**: Steps, CFG Scale, Resolution, Seed
- ✅ **Batch Processing**: Generate multiple images
- ✅ **Image Editing**: Upscale, Inpaint, Outpaint, Variations
- ✅ **Enhanced Gallery**: Grid/List views with filtering
- ✅ **Workspace Management**: Organize projects
- ✅ **System Status**: Real-time API status monitoring

### Technical Improvements
- Better error handling
- More detailed logging
- Enhanced prompt processing
- Optimized build
- Responsive design

---

## 🌐 **ACCESS URLs**

| App | URL |
|-----|-----|
| **🧠 Neural-OS** | http://76.13.242.128 |
| **🎨 AI Generator v3.0** | **http://76.13.242.128:3000** |
| **👤 Holosphere** | https://holosphere.verilysovereign.online |

---

## 🆘 **TROUBLESHOOTING**

### "API key not configured"
- Add your API key to `/var/www/ai-generator/.env`
- Restart with `pm2 restart all`

### "Generation failed"
- Check API key is valid
- Verify you have credits on the provider
- Check logs: `pm2 logs`

### "Cannot connect"
- Check backend: `pm2 status`
- Verify port 5000: `ss -tlnp | grep 5000`
- Check frontend: `ss -tlnp | grep 3000`

### Clear browser cache:
Press `Ctrl + Shift + R` for hard refresh

---

## 📊 **SYSTEM REQUIREMENTS**

- **Node.js**: 18+
- **Memory**: 2GB+ recommended
- **Storage**: 10GB+ for generated images
- **Network**: Open ports 3000 and 5000

---

Built with ❤️ using React, Node.js, and Cyberpunk aesthetics
