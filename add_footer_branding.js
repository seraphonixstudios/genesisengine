const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Update the footer with branding
const oldFooter = `<Box className="cyberpunk-footer">
          <Typography variant="caption" className="footer-text">
            [SYSTEM] NEURAL ART ENGINE v3.0 // PROTOCOL: ONLINE // ATLANTEAN TECH ARCHITECTURE
          </Typography>
        </Box>`;

const newFooter = `<Box className="cyberpunk-footer" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" sx={{ color: '#ffc107', fontFamily: 'Orbitron, sans-serif', fontSize: '0.65rem' }}>
              SERAPHONIX STUDIOS
            </Typography>
            <Typography variant="caption" sx={{ color: '#00ff00' }}>
              ✦
            </Typography>
            <Typography variant="caption" sx={{ color: '#ffc107', fontFamily: 'Orbitron, sans-serif', fontSize: '0.65rem' }}>
              SOVEREIGN VERILY
            </Typography>
          </Box>
          <Typography variant="caption" className="footer-text">
            [SYSTEM] NEURAL ART ENGINE v3.0 // PROTOCOL: ONLINE // ATLANTEAN TECH ARCHITECTURE
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem' }}>
            © 2026 Seraphonix Studios x Sovereign Verily. All rights reserved.
          </Typography>
        </Box>`;

content = content.replace(oldFooter, newFooter);

fs.writeFileSync(appFile, content);
console.log('Updated footer with branding and copyright!');
