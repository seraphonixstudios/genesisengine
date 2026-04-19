const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Add branding logo component
const brandingComponent = `
// Branding Logo Component
function BrandingHeader() {
  return React.createElement(Box, {
    sx: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
      py: 2,
      borderBottom: '1px solid rgba(255, 193, 7, 0.3)',
      background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,20,0,0.6) 100%)'
    }
  }, [
    // Seraphonix Studios Logo
    React.createElement(Box, {
      key: 'seraphonix',
      sx: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1
      }
    }, [
      React.createElement('svg', {
        width: 60,
        height: 60,
        viewBox: '0 0 100 100',
        style: { filter: 'drop-shadow(0 0 10px rgba(255, 193, 7, 0.5))' }
      }, [
        React.createElement('path', {
          d: 'M50 10 L90 50 L50 90 L10 50 Z',
          fill: 'none',
          stroke: '#ffc107',
          strokeWidth: 3
        }),
        React.createElement('path', {
          d: 'M50 20 L80 50 L50 80 L20 50 Z',
          fill: 'none',
          stroke: '#ffc107',
          strokeWidth: 2
        }),
        React.createElement('path', {
          d: 'M50 30 Q60 40 50 50 Q40 60 50 70 Q55 50 50 30',
          fill: '#ffc107'
        }),
        React.createElement('circle', {
          cx: 50,
          cy: 45,
          r: 8,
          fill: '#ff6f00'
        })
      ]),
      React.createElement(Typography, {
        variant: 'caption',
        sx: {
          color: '#ffc107',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
          textShadow: '0 0 10px rgba(255, 193, 7, 0.5)'
        }
      }, 'SERAPHONIX STUDIOS')
    ]),
    
    // Divider
    React.createElement(Box, {
      key: 'divider',
      sx: {
        width: 1,
        height: 50,
        background: 'linear-gradient(180deg, transparent, #ffc107, transparent)'
      }
    }),
    
    // Sovereign Verily Logo
    React.createElement(Box, {
      key: 'sovereign',
      sx: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1
      }
    }, [
      React.createElement('svg', {
        width: 60,
        height: 60,
        viewBox: '0 0 100 100',
        style: { filter: 'drop-shadow(0 0 10px rgba(255, 193, 7, 0.5))' }
      }, [
        // Crown
        React.createElement('path', {
          d: 'M30 25 L50 15 L70 25 L65 35 L50 30 L35 35 Z',
          fill: '#ffc107'
        }),
        // Wings left
        React.createElement('path', {
          d: 'M25 40 Q10 30 5 45 Q15 50 25 45',
          fill: '#ffc107'
        }),
        // Wings right
        React.createElement('path', {
          d: 'M75 40 Q90 30 95 45 Q85 50 75 45',
          fill: '#ffc107'
        }),
        // V letter
        React.createElement('path', {
          d: 'M35 40 L50 85 L65 40 L55 40 L50 70 L45 40 Z',
          fill: '#ffc107'
        })
      ]),
      React.createElement(Typography, {
        variant: 'caption',
        sx: {
          color: '#ffc107',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
          textShadow: '0 0 10px rgba(255, 193, 7, 0.5)'
        }
      }, 'SOVEREIGN VERILY')
    ])
  ]);
}

`;

// Insert branding component before App function
content = content.replace('function App() {', brandingComponent + 'function App() {');

// Add BrandingHeader to the main return
const oldReturn = `return (
    <ThemeProvider theme={cyberpunkTheme}>
      <MatrixRain />`;

const newReturn = `return (
    <ThemeProvider theme={cyberpunkTheme}>
      <MatrixRain />
      <BrandingHeader />`;

content = content.replace(oldReturn, newReturn);

fs.writeFileSync(appFile, content);
console.log('Added Seraphonix Studios and Sovereign Verily branding!');
console.log('- Gold/yellow logos in header');
console.log('- SVG-based logo implementations');
console.log('- Professional branding displayed');
