# VPS Full Pipeline - Complete System Documentation

## Overview

This VPS hosts a complete AI-powered system with three main components:
1. **Genesis Engine** - AI Image Generation (port 3000)
2. **Neural-OS** - Security & System Management (port 3077)
3. **Nginx** - Reverse Proxy & SSL (port 443)

## Quick Links

- **Main Site:** https://verilysovereign.org
- **Genesis Engine:** https://verilysovereign.org/genesis
- **Neural-OS:** https://verilysovereign.org/neural-os
- **API Docs:** See below

## System Architecture

```
User → Nginx (443) → /genesis → Genesis Engine (3000)
                → /neural-os → Neural-OS Dashboard (static)
                → /api/* → Neural-OS API (3077)
                → /genesis/api/* → Genesis API (3000)
```

## Genesis Engine

### Features
- **9 Open-Source Models:** SD 1.5, Realistic Vision, DreamShaper, Deliberate, Anything V3, Counterfeit, SDXL Base, SDXL Turbo, OpenJourney
- **14 Sampling Methods:** DPM++ 2M, DPM++ 2M Karras, Euler, Euler a, DDIM, LMS, PNDM, UniPC, and more
- **9 ControlNet Types:** Canny, Depth, OpenPose, Scribble, Lineart, Softedge, Shuffle, Tile, Inpaint
- **8 Style Presets:** Photorealistic, Anime, Digital Art, Oil Painting, Cinematic, Cyberpunk, Fantasy, Portrait
- **Batch Generation:** Up to 10 prompts simultaneously
- **Queue Management:** Concurrent request handling with status tracking

### API Endpoints v2

```
GET  /genesis/api/v2/status              # System status
GET  /genesis/api/v2/models              # Available models
GET  /genesis/api/v2/schedulers          # Sampling methods
GET  /genesis/api/v2/controlnet-types    # ControlNet options
GET  /genesis/api/v2/styles              # Style presets
GET  /genesis/api/v2/queue               # Queue status
GET  /genesis/api/v2/status/{id}         # Generation status

POST /genesis/api/v2/generate            # Generate image
POST /genesis/api/v2/batch               # Batch generation
POST /genesis/api/v2/img2img             # Image-to-image
POST /genesis/api/v2/inpaint             # Inpainting
POST /genesis/api/v2/upscale             # Image upscaling
POST /genesis/api/v2/controlnet          # ControlNet generation
```

### Generate Request Example
```json
{
  "prompt": "beautiful sunset over mountains",
  "negative_prompt": "blurry, low quality",
  "width": 1024,
  "height": 768,
  "num_inference_steps": 25,
  "guidance_scale": 7.5,
  "scheduler": "DPM++ 2M",
  "model_id": "sd-1-5",
  "style": "photorealistic",
  "seed": 12345
}
```

## Neural-OS

### Features
- **System Monitoring:** Real-time CPU, memory, disk, network stats
- **Security Dashboard:** Threat detection, IP blocking, scan history
- **Malware Scanner:** File scanning with threat detection
- **File Manager:** Browse, read, write, create, delete files
- **Terminal:** Command execution with sandboxing
- **WebSocket:** Real-time metrics streaming

### Authentication
```bash
POST /api/auth/admin
Body: {"password": "seraphadmin"}
Response: {"success": true, "token": "..."}
```

### API Endpoints

```
# Auth
POST /api/auth/admin              # Login
POST /api/auth/verify-2fa         # 2FA verification
GET  /api/auth/verify             # Verify token
POST /api/auth/logout             # Logout

# System
GET  /api/system                  # Full system info
GET  /api/system/status           # Quick status
GET  /api/system/processes        # Process list

# Security
GET  /api/security/dashboard      # Security overview
POST /api/security/scan           # Start malware scan
GET  /api/security/scan/{id}      # Scan status
GET  /api/security/scans          # Scan history
GET  /api/security/threats        # Recent threats
POST /api/security/block          # Block IP
DELETE /api/security/block/{ip}   # Unblock IP

# Files
GET  /api/files/list?path=...     # List directory
GET  /api/files/read?path=...     # Read file
POST /api/files/write             # Write file
POST /api/files/create            # Create file/directory
POST /api/files/rename            # Rename
DELETE /api/files/delete          # Delete

# Terminal
POST /api/terminal/exec           # Execute command

# Logs
GET  /api/logs/genesis            # Genesis logs
GET  /api/logs/system             # System logs
```

## Process Management

All services managed by PM2:

```bash
# View status
pm2 status

# Restart services
pm2 restart genesis-engine
pm2 restart neural-os

# View logs
pm2 logs genesis-engine
pm2 logs neural-os

# Monitor
pm2 monit
```

## Backup System

### Location
```
/opt/backups/
├── RESTORE.sh              # One-command restore script
├── neural-os/              # Neural-OS backups
├── genesis-engine/         # Genesis Engine backups
├── nginx/                  # Nginx config + SSL backups
└── LATEST_MANIFEST.txt     # Backup documentation
```

### Usage
```bash
# Restore Neural-OS
cd /opt/backups && ./RESTORE.sh neural-os

# Restore Genesis Engine
cd /opt/backups && ./RESTORE.sh genesis-engine

# Restore everything
cd /opt/backups && ./RESTORE.sh all
```

## Mobile Accessibility

Both interfaces include:
- Responsive design with mobile breakpoints
- Touch-friendly targets (44px minimum)
- Viewport meta tags
- Reduced motion support
- Safe area padding for notched devices
- Mobile navigation with hamburger menu

## Security Features

- **SSL Certificate:** Valid through July 24, 2026
- **Rate Limiting:** 50 requests per 15 minutes (generation), 10 auth attempts
- **IP Blocking:** Manual and automatic threat-based blocking
- **Request Analysis:** SQL injection, XSS, path traversal detection
- **Command Sandboxing:** Terminal commands validated against whitelist
- **Session Management:** JWT tokens with 24h expiration

## Testing

### Run Full Pipeline Test
```bash
# On the VPS
/opt/polished-pipeline-test.sh
```

### Test Results (Latest)
- **Pass Rate:** 100% (16/16 tests)
- **API Endpoints:** All operational
- **Authentication:** Working
- **UI Loading:** Both interfaces accessible

## Configuration Files

| File | Description |
|------|-------------|
| `/etc/nginx/sites-enabled/verilysovereign.org` | Nginx routing config |
| `/opt/neural-os/server.js` | Neural-OS backend |
| `/var/www/genesis-engine/server.js` | Genesis backend |
| `/var/www/html/neural-os-dashboard.html` | Neural-OS UI |
| `/var/www/genesis-engine/index.html` | Genesis UI |
| `/opt/backups/RESTORE.sh` | Backup restore script |

## Troubleshooting

### Genesis Engine not responding
```bash
pm2 restart genesis-engine
```

### Neural-OS not responding
```bash
pm2 restart neural-os
```

### Nginx config error
```bash
nginx -t
# If valid:
nginx -s reload
```

### Check SSL certificate
```bash
openssl s_client -connect verilysovereign.org:443 -servername verilysovereign.org </dev/null | openssl x509 -noout -dates
```

## Development

### Adding New Genesis API Features
1. Add endpoint to `/var/www/genesis-engine/enhanced-api.js`
2. Restart: `pm2 restart genesis-engine`
3. Test: `/opt/post-upgrade-test.sh`

### Modifying Neural-OS
1. Edit `/opt/neural-os/server.js` (backend)
2. Edit `/var/www/html/neural-os-dashboard.html` (frontend)
3. Restart: `pm2 restart neural-os`
4. Test: `/opt/post-upgrade-test.sh`

## Support

For issues or enhancements:
1. Check logs: `pm2 logs`
2. Run tests: `/opt/polished-pipeline-test.sh`
3. Verify backups: `ls -la /opt/backups/`
4. Review nginx config: `nginx -T`

---

**Last Updated:** May 2, 2026
**Version:** 3.0
**Status:** Production Ready
