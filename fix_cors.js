const fs = require('fs');

const serverFile = '/var/www/ai-generator/server/server.js';
let content = fs.readFileSync(serverFile, 'utf8');

// Find the CORS middleware section and replace it with a more permissive setup
const oldCors = `app.use(cors({
  origin: '*',
  credentials: true
}));`;

const newCors = `// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Also keep the cors middleware for compatibility
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));`;

content = content.replace(oldCors, newCors);

fs.writeFileSync(serverFile, content);
console.log('Fixed CORS configuration');
