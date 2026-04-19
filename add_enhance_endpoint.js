const fs = require('fs');

const serverFile = '/var/www/ai-generator/server/server.js';
let content = fs.readFileSync(serverFile, 'utf8');

// Add the enhance-prompt endpoint after the generate endpoint
const enhanceEndpoint = `
// Prompt Enhancement Endpoint
app.post('/api/enhance-prompt', (req, res) => {
  try {
    const { prompt, style = '', stylePreset = 'none' } = req.body;
    
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });
    
    const enhanced = enhancePrompt(prompt, style, stylePreset);
    
    res.json({
      originalPrompt: prompt,
      enhancedPrompt: enhanced.prompt,
      negativePrompt: enhanced.negativePrompt
    });
  } catch (error) {
    console.error('Enhancement error:', error);
    res.status(500).json({ error: error.message || 'Enhancement failed' });
  }
});
`;

// Find the line after the generate endpoint and insert the new endpoint
const insertAfter = "res.status(500).json({ error: error.message || 'Generation failed' });\n  }\n});";
content = content.replace(insertAfter, insertAfter + enhanceEndpoint);

fs.writeFileSync(serverFile, content);
console.log('Added /api/enhance-prompt endpoint');
