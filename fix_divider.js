const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Find and replace the divider Box
const oldDivider = `// Divider
    React.createElement(Box, {
      key: 'divider',
      sx: {
        width: 1,
        height: 50,
        background: 'linear-gradient(180deg, transparent, #ffc107, transparent)'
      }
    }),`;

const newDivider = `// Divider (Lightsaber style)
    React.createElement(Box, {
      key: 'divider',
      sx: {
        width: 3,
        height: 40,
        background: 'linear-gradient(180deg, transparent, #00f5ff, #00f5ff, transparent)',
        boxShadow: '0 0 10px #00f5ff, 0 0 20px #00f5ff, 0 0 30px #00f5ff',
        animation: 'pulse 2s infinite',
        borderRadius: '2px'
      }
    }),`;

content = content.replace(oldDivider, newDivider);

fs.writeFileSync(appFile, content);
console.log('Fixed! Divider is now 3px cyan lightsaber with glow');
