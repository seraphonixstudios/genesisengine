const http = require('http');

// Test server health
const req = http.get('http://localhost:5000/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ Server Health Check:');
    console.log(JSON.parse(data));
  });
});

req.on('error', (err) => {
  console.log('❌ Server not running:', err.message);
});

setTimeout(() => {}, 1000);
