const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Add Matrix rain component before the App function
const matrixRainComponent = `
// Matrix Rain Effect Component
function MatrixRain() {
  const canvasRef = React.useRef(null);
  
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const nums = '0123456789';
    const alphabet = katakana + latin + nums;
    
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const rainDrops = [];
    
    for (let x = 0; x < columns; x++) {
      rainDrops[x] = Math.random() * -100;
    }
    
    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#0F0';
      ctx.font = fontSize + 'px monospace';
      
      for (let i = 0; i < rainDrops.length; i++) {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);
        
        if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          rainDrops[i] = 0;
        }
        rainDrops[i]++;
      }
    };
    
    const interval = setInterval(draw, 30);
    
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
      opacity: 0.15,
      pointerEvents: 'none'
    }
  });
}

`;

// Insert MatrixRain component before App function
content = content.replace('function App() {', matrixRainComponent + 'function App() {');

// Add MatrixRain to the main render
const oldReturn = `return (
    <ThemeProvider theme={cyberpunkTheme}>`;

const newReturn = `return (
    <ThemeProvider theme={cyberpunkTheme}>
      <MatrixRain />`;

content = content.replace(oldReturn, newReturn);

// Update glitch effect on title
content = content.replace(
  `<Typography variant="h4" className="glitch-title" data-text={glitchText}>`,
  `<Typography variant="h4" className="glitch-title matrix-glitch" data-text={glitchText}>`
);

fs.writeFileSync(appFile, content);
console.log('Added Matrix rain background and glitch effects!');
console.log('- Matrix rain canvas with falling green code');
console.log('- Glitch effect on title');
console.log('- Cyberpunk/Matrix aesthetic applied');
