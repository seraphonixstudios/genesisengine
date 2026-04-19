const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Change divider to thin lightsaber/energy beam style
content = content.replace(
  /sx: \{\s*width: 1,\s*height: 50,\s*background: 'linear-gradient\(180deg, transparent, #00f5ff, transparent\)'\s*\}/,
  `sx: {
        width: 2,
        height: 40,
        background: 'linear-gradient(180deg, transparent, #00f5ff, #00f5ff, transparent)',
        boxShadow: '0 0 10px #00f5ff, 0 0 20px #00f5ff, 0 0 30px #00f5ff',
        animation: 'pulse 2s infinite'
      }`
);

fs.writeFileSync(appFile, content);
console.log('Made divider thinner like lightsaber/energy beam with cyan glow');
