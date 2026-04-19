const fs = require('fs');

const serverFile = '/var/www/ai-generator/server/server.js';
let content = fs.readFileSync(serverFile, 'utf8');

// Add SSE endpoint for progress tracking before the existing endpoints
const sseEndpoint = `
// ==================== PROGRESS TRACKING ====================
const progressClients = new Map();

function sendProgress(sessionId, data) {
  const client = progressClients.get(sessionId);
  if (client) {
    client.write('data: ' + JSON.stringify(data) + '\\n\\n');
  }
}

app.get('/api/progress/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  progressClients.set(sessionId, res);
  
  // Send initial connection message
  res.write('data: ' + JSON.stringify({ status: 'connected', sessionId }) + '\\n\\n');
  
  req.on('close', () => {
    progressClients.delete(sessionId);
  });
});

`;

// Find where to insert (after the middleware setup, before the generate endpoint)
const insertPoint = content.indexOf("// ==================== GENERATION ENDPOINTS ====================");
if (insertPoint !== -1) {
  content = content.slice(0, insertPoint) + sseEndpoint + content.slice(insertPoint);
}

// Update the generate endpoint to send progress updates
const oldGenerateStart = `app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, provider = 'huggingface', model, negativePrompt = '', seed, steps = 30, width = 512, height = 512, guidanceScale = 7.5, sampler = 'DPM++ 2M Karras', style = '', stylePreset = 'none', enhance = true } = req.body;`;

const newGenerateStart = `app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, provider = 'huggingface', model, negativePrompt = '', seed, steps = 30, width = 512, height = 512, guidanceScale = 7.5, sampler = 'DPM++ 2M Karras', style = '', stylePreset = 'none', enhance = true, sessionId } = req.body;
    
    // Send initial progress
    if (sessionId) {
      sendProgress(sessionId, { 
        status: 'initializing', 
        message: 'Initializing neural networks...',
        progress: 5 
      });
    }`;

content = content.replace(oldGenerateStart, newGenerateStart);

// Add progress updates during generation
const oldSwitch = `let result;
    switch (provider) {`;

const newSwitch = `let result;
    
    if (sessionId) {
      sendProgress(sessionId, { 
        status: 'enhancing', 
        message: 'Enhancing prompt with AI protocols...',
        progress: 15 
      });
    }
    
    switch (provider) {`;

content = content.replace(oldSwitch, newSwitch);

// Add final progress before sending result
const oldResultSend = `res.json(result);
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message || 'Generation failed' });
  }
});`;

const newResultSend = `if (sessionId) {
      sendProgress(sessionId, { 
        status: 'complete', 
        message: 'Generation complete!',
        progress: 100,
        result 
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Generation error:', error);
    if (sessionId) {
      sendProgress(sessionId, { 
        status: 'error', 
        message: error.message || 'Generation failed',
        progress: 0 
      });
    }
    res.status(500).json({ error: error.message || 'Generation failed' });
  }
});`;

content = content.replace(oldResultSend, newResultSend);

fs.writeFileSync(serverFile, content);
console.log('Added SSE progress tracking to server.js');
