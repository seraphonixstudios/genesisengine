const fs = require('fs');
const file = '/var/www/ai-generator/server/server.js';
let content = fs.readFileSync(file, 'utf8');

// Fix the app.listen line
content = content.replace(/app\.listen\(PORT,.*\(\) => \{/, 'app.listen(PORT, "0.0.0.0", () => {');

fs.writeFileSync(file, content);
console.log('Fixed app.listen to bind to 0.0.0.0');
