const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Change the divider color from gold to cyan
content = content.replace(
  "background: 'linear-gradient(180deg, transparent, #ffc107, transparent)'",
  "background: 'linear-gradient(180deg, transparent, #00f5ff, transparent)'"
);

// Also update any other gold dividers to cyan
content = content.replace(/#ffc107/g, '#00f5ff');

fs.writeFileSync(appFile, content);
console.log('Changed divider color from gold to cyan (#00f5ff)');
