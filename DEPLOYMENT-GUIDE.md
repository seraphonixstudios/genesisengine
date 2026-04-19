# AI Image Generator - Deployment Lessons Learned

## What Went Wrong & How to Fix It

### 1. JSON Parsing Errors (Shell Escaping)
**Problem:** PowerShell/bash escapes JSON characters incorrectly when passing inline
**Solution:** Use base64 encoding or files for JSON data
```bash
# WRONG:
curl -d '{"prompt":"test"}'

# RIGHT:
echo '{"prompt":"test"}' > /tmp/test.json
curl -d @/tmp/test.json

# OR use base64:
echo eyJwcm9tcHQiOiJ0ZXN0In0= | base64 -d > /tmp/test.json
```

### 2. Missing API Endpoints
**Problem:** Frontend expects endpoints that don't exist
**Solution:** Always check frontend code for API calls
```javascript
// Check what the frontend calls:
/api/me           // User info
/api/favorites    // Favorites
/api/generations  // List generations
/api/generate     // Create image
```

### 3. Wrong Response Format
**Problem:** Server returns `{ id: "..." }` but frontend expects `{ generation: { id: "..." } }`
**Solution:** Match frontend expectations exactly
```javascript
// Frontend expects:
{
  success: true,
  generation: {
    id: "...",
    status: "PROCESSING",
    prompt: "..."
  }
}
```

### 4. Static Files Not Served
**Problem:** `/uploads/` folder not accessible
**Solution:** Add explicit route BEFORE SPA fallback
```javascript
// MUST be before app.use(express.static())
app.use('/uploads', express.static(uploadsDir));
```

### 5. Wrong Property Names
**Problem:** Server uses `imageUrl`, frontend expects `url`
**Solution:** Check frontend property access
```javascript
// Frontend uses:
gen.url      // NOT gen.imageUrl
gen.id       // NOT gen.generationId
```

### 6. API Keys Overwritten
**Problem:** Deploying new code overwrites .env file
**Solution:** Never overwrite .env in deployment scripts
```bash
# WRONG:
scp .env server:/app/

# RIGHT:
# Keep .env on server, only update if missing
```

### 7. Placeholder Images Instead of Real AI
**Problem:** Using placeholder.co instead of actual generation
**Solution:** Use reliable free APIs
```javascript
// Working options:
// 1. Pollinations.ai (used in final solution)
// 2. Hugging Face (requires paid tier or wait for model to wake)
```

## Complete Working Server Code

See: `/var/www/ai-image-generator/server.js`

Key features:
- Uses Pollinations.ai for reliable image generation
- Serves static files correctly
- All required API endpoints implemented
- Proper error handling

## Deployment Checklist

- [ ] Upload server.js
- [ ] Verify .env has real API keys
- [ ] Create uploads directory
- [ ] Install dependencies: `npm install`
- [ ] Start with PM2: `pm2 start server.js`
- [ ] Test health endpoint: `/api/health`
- [ ] Test generate endpoint with base64 JSON
- [ ] Verify images save to uploads/
- [ ] Test image URL directly: `/uploads/[id].png`
- [ ] Test full frontend flow

## Testing Commands

```bash
# Test health
curl http://localhost:3000/api/health

# Test generate (use base64 to avoid escaping issues)
echo eyJwcm9tcHQiOiJ0ZXN0In0= | base64 -d > /tmp/test.json
curl -X POST http://localhost:3000/api/generate \
  -H 'Content-Type: application/json' \
  -d @/tmp/test.json

# Check generation status
curl http://localhost:3000/api/generations/[ID]

# Verify image exists
ls -la /var/www/ai-image-generator/uploads/

# Test image URL
curl -I http://localhost:3000/uploads/[ID].png
```

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server status |
| `/api/generate` | POST | Create image |
| `/api/generations` | GET | List all |
| `/api/generations/:id` | GET | Get one |
| `/api/generations/:id` | DELETE | Delete |
| `/api/auth/login` | POST | Login |
| `/api/auth/register` | POST | Register |
| `/api/auth/me` | GET | Current user |
| `/api/me` | GET | Current user (alias) |
| `/api/favorites` | GET | List favorites |
| `/api/favorites/:id` | POST | Add favorite |
| `/api/favorites/:id` | DELETE | Remove favorite |

## Environment Variables

```
PORT=3000
JWT_SECRET=your-secret-key
HUGGINGFACE_API_KEY=your-key (optional, using Pollinations.ai instead)
```

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| 410 Gone | Hugging Face model sleeping | Use Pollinations.ai or wait |
| 403 Forbidden | Not logged in | Login first |
| 404 Not Found | Missing endpoint | Add endpoint |
| SyntaxError JSON | Shell escaping | Use base64 or file |
| Image not showing | Static files not served | Add `/uploads` route |
| Placeholder images | Using mock data | Connect real API |

## Final Solution Used

**Image Generation:** Pollinations.ai (free, reliable)
```javascript
const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true`;
```

**Key fixes that made it work:**
1. Added `app.use('/uploads', express.static(uploadsDir))` 
2. Changed `imageUrl` to `url` in response
3. Used Pollinations.ai instead of Hugging Face
4. Added all missing API endpoints
5. Used base64 for JSON testing to avoid shell escaping

## Remember

1. **Always test with real data** - not placeholders
2. **Check frontend expectations** - match property names exactly
3. **Serve static files explicitly** - don't rely on catch-all
4. **Use reliable APIs** - free tiers often sleep/fail
5. **Test end-to-end** - don't assume it works until image displays
6. **Document everything** - so you don't forget next time
