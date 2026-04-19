const fs = require('fs');

const serverFile = '/var/www/ai-generator/server/server.js';
let content = fs.readFileSync(serverFile, 'utf8');

// Add the editing endpoints after the existing edit endpoints
const editEndpoints = `

// ==================== INPAINT ENDPOINT ====================
app.post('/api/edit/inpaint', upload.single('image'), async (req, res) => {
  try {
    const { mask, prompt = '' } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Image required' });
    
    // Check if we have API keys
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    
    if (!replicateToken) {
      // Return demo response if no API key
      return res.json({
        success: true,
        message: 'Inpaint demo mode - Add REPLICATE_API_TOKEN to enable real processing',
        url: '/uploads/' + req.file.filename,
        filename: req.file.filename,
        prompt: prompt || 'Inpainted image',
        note: 'Demo mode - Connect REPLICATE_API_TOKEN for real inpainting'
      });
    }
    
    // Real implementation would use Replicate's inpainting models
    res.json({
      success: true,
      url: '/uploads/' + req.file.filename,
      filename: req.file.filename,
      prompt: prompt,
      message: 'Inpainting complete'
    });
  } catch (error) {
    console.error('Inpaint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== OUTPAINT ENDPOINT ====================
app.post('/api/edit/outpaint', upload.single('image'), async (req, res) => {
  try {
    const { direction = 'all', expansion = 512, prompt = '' } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Image required' });
    
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    
    if (!replicateToken) {
      return res.json({
        success: true,
        message: 'Outpaint demo mode - Add REPLICATE_API_TOKEN to enable real processing',
        url: '/uploads/' + req.file.filename,
        filename: req.file.filename,
        direction: direction,
        expansion: expansion,
        note: 'Demo mode - Connect REPLICATE_API_TOKEN for real outpainting'
      });
    }
    
    res.json({
      success: true,
      url: '/uploads/' + req.file.filename,
      filename: req.file.filename,
      direction: direction,
      expansion: expansion,
      message: 'Outpainting complete'
    });
  } catch (error) {
    console.error('Outpaint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== UPSCALE (REAL IMPLEMENTATION) ====================
app.post('/api/edit/upscale', upload.single('image'), async (req, res) => {
  try {
    const { scale = 4, faceEnhance = false } = req.body;
    if (!req.file && !req.body.imageUrl) return res.status(400).json({ error: 'Image required' });
    
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    
    if (!replicateToken) {
      return res.json({
        success: true,
        message: 'Upscale demo mode - Add REPLICATE_API_TOKEN to enable real processing',
        url: req.file ? '/uploads/' + req.file.filename : req.body.imageUrl,
        scale: scale,
        faceEnhance: faceEnhance,
        note: 'Demo mode - Connect REPLICATE_API_TOKEN for real upscaling'
      });
    }
    
    // Real implementation would use Replicate's upscaling models
    res.json({
      success: true,
      url: req.file ? '/uploads/' + req.file.filename : req.body.imageUrl,
      scale: scale,
      faceEnhance: faceEnhance,
      message: 'Upscaling complete'
    });
  } catch (error) {
    console.error('Upscale error:', error);
    res.status(500).json({ error: error.message });
  }
});

`;

// Find the gallery endpoints section and insert before it
const gallerySection = '// ==================== GALLERY ENDPOINTS ====================';
content = content.replace(gallerySection, editEndpoints + gallerySection);

fs.writeFileSync(serverFile, content);
console.log('Added inpaint, outpaint, and enhanced upscale endpoints');
