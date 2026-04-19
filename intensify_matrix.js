const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Replace MatrixRain with intensified version
const oldMatrixRain = `// Matrix Rain Effect Component
function MatrixRain\(\) \{[\s\S]*?return React\.createElement\('canvas'[\s\S]*?\}\s*\}`;

const newMatrixRain = `// Matrix Rain Effect Component - INTENSIFIED
function MatrixRain() {
  const canvasRef = React.useRef(null);
  
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Intensified Matrix characters
    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
    const chars = katakana + latin;
    
    const fontSize = 18;
    const columns = canvas.width / fontSize;
    const drops = [];
    
    // Initialize drops at random positions above screen
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }
    
    const draw = () => {
      // Semi-transparent black for trail effect (more visible)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = 'bold ' + fontSize + 'px monospace';
      
      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        
        // Bright green with glow
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 15;
        
        // Draw character
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        // Reset shadow for performance
        ctx.shadowBlur = 0;
        
        // Send drop back to top randomly after it crosses screen
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        
        // Increment Y coordinate
        drops[i]++;
      }
    };
    
    const interval = setInterval(draw, 35);
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return React.createElement('canvas', {
    ref: canvasRef,
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      opacity: 0.8,
      pointerEvents: 'none',
      background: 'rgba(0, 5, 0, 0.3)'
    }
  });
}

`;

content = content.replace(new RegExp(oldMatrixRain), newMatrixRain);

// Add glitch class to title
content = content.replace(
  'className="glitch-title"',
  'className="glitch-title intense-glitch"'
);

// Add screen effects container
const oldReturn = `return (
    <ThemeProvider theme={cyberpunkTheme}>
      <MatrixRain />`;

const newReturn = `return (
    <ThemeProvider theme={cyberpunkTheme}>
      <MatrixRain />
      <div className="max-headroom-scanlines" />
      <div className="max-headroom-static" />`;

content = content.replace(oldReturn, newReturn);

fs.writeFileSync(appFile, content);
console.log('Intensified MatrixRain component');
console.log('Added glitch class to title');
console.log('Added Max Headroom scanlines and static overlays');
