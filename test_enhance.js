const http = require('http');

const data = JSON.stringify({
  prompt: 'a beautiful cat sitting on a window',
  stylePreset: 'cyberpunk'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/enhance-prompt',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log('Response:', responseData);
    const parsed = JSON.parse(responseData);
    console.log('Enhanced prompt:', parsed.enhancedPrompt);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(data);
req.end();
