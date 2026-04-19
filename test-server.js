const express = require('express');
const app = express();
app.use(express.json());

// Simple test routes
app.get('/health', (req, res) => {
  console.log('Health endpoint hit');
  res.json({ status: 'ok' });
});

app.post('/generate', (req, res) => {
  console.log('Generate endpoint hit');
  res.json({ id: 'test-123', status: 'PROCESSING' });
});

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('  GET  /health');
  console.log('  POST /generate');
});
