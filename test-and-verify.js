const { spawn } = require('child_process');
const http = require('http');

console.log('Starting server test...\n');

// Start the fixed server
const server = spawn('node', ['server-fixed.js'], {
  env: { ...process.env, PORT: '5000' },
  cwd: 'C:\\Users\\User\\Desktop\\capital\\AI Image Generator'
});

server.stdout.on('data', (data) => {
  console.log(`[SERVER] ${data.toString().trim()}`);
});

server.stderr.on('data', (data) => {
  console.log(`[SERVER ERROR] ${data.toString().trim()}`);
});

// Wait for server to start
setTimeout(() => {
  console.log('\n--- Testing Endpoints ---\n');
  
  // Test health
  http.get('http://localhost:5000/health', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`Health: ${res.statusCode} - ${body}`);
      testGenerate();
    });
  }).on('error', (e) => {
    console.log(`Health Error: ${e.message}`);
    testGenerate();
  });
}, 3000);

function testGenerate() {
  const data = JSON.stringify({ prompt: 'test image', width: 512, height: 512 });
  
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`Generate: ${res.statusCode} - ${body}`);
      server.kill();
      process.exit(0);
    });
  });
  
  req.on('error', (e) => {
    console.log(`Generate Error: ${e.message}`);
    server.kill();
    process.exit(1);
  });
  
  req.write(data);
  req.end();
}
