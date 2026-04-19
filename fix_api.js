const fs = require('fs');
let content = fs.readFileSync('/var/www/ai-generator/client/src/App.js', 'utf8');

// 1. Add API_BASE before function App()
content = content.replace('function App()', "const API_BASE = 'http://76.13.242.128:5000';\n\nfunction App()");

// 2. Fix fetch URL
content = content.replace("fetch('/api/generate'", "fetch(API_BASE + '/api/generate'");

fs.writeFileSync('/var/www/ai-generator/client/src/App.js', content);
console.log('Fixed API URLs');
