const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Replace the entire BrandingHeader component with corner-positioned images
const oldBranding = `// Branding Logo Component
function BrandingHeader\(\) \{[\s\S]*?\],\s*\)\];\s*\}`;

const newBranding = `// Branding Logo Component - Corner positioned with actual images
function BrandingHeader() {
  return React.createElement(Box, {
    sx: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '80px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      px: 3,
      zIndex: 1000,
      background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,20,0,0.7) 50%, transparent 100%)',
      pointerEvents: 'none'
    }
  }, [
    // Left corner - Seraphonix Studios
    React.createElement(Box, {
      key: 'seraphonix',
      sx: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'auto'
      }
    }, [
      React.createElement('img', {
        src: '/seraphonix-logo.png',
        alt: 'Seraphonix Studios',
        style: {
          height: '50px',
          width: 'auto',
          filter: 'drop-shadow(0 0 10px rgba(255, 193, 7, 0.8))'
        }
      }),
      React.createElement(Typography, {
        variant: 'caption',
        sx: {
          color: '#ffc107',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '0.6rem',
          letterSpacing: '0.1em',
          mt: 0.5,
          textShadow: '0 0 10px rgba(255, 193, 7, 0.8)'
        }
      }, 'SERAPHONIX STUDIOS')
    ]),
    
    // Right corner - Sovereign Verily
    React.createElement(Box, {
      key: 'sovereign',
      sx: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'auto'
      }
    }, [
      React.createElement('img', {
        src: '/sovereign-logo.png',
        alt: 'Sovereign Verily',
        style: {
          height: '50px',
          width: 'auto',
          filter: 'drop-shadow(0 0 10px rgba(255, 193, 7, 0.8))'
        }
      }),
      React.createElement(Typography, {
        variant: 'caption',
        sx: {
          color: '#ffc107',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '0.6rem',
          letterSpacing: '0.1em',
          mt: 0.5,
          textShadow: '0 0 10px rgba(255, 193, 7, 0.8)'
        }
      }, 'SOVEREIGN VERILY')
    ])
  ]);
}

`;

content = content.replace(new RegExp(oldBranding), newBranding);

// Also remove the old center BrandingHeader if it exists in a different format
content = content.replace(
  /React\.createElement\(BrandingHeader, \{\}\),/g,
  'React.createElement(BrandingHeader, {}),'
);

// Fix MatrixRain opacity to make it more visible
content = content.replace(
  "opacity: 0.15,",
  "opacity: 0.35,"
);

fs.writeFileSync(appFile, content);
console.log('Updated:');
console.log('- Logos now use actual PNG image files');
console.log('- Positioned at top LEFT and RIGHT corners');
console.log('- Matrix rain opacity increased to 35% (more visible)');
