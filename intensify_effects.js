const fs = require('fs');

const cssFile = '/var/www/ai-generator/client/src/cyberpunk-atlantean.css';
let content = fs.readFileSync(cssFile, 'utf8');

// Add intensified effects
const intenseEffects = `

/* ==================== INTENSIFIED MATRIX RAIN ==================== */
.matrix-rain-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  opacity: 0.7 !important;
  background: #000;
}

.matrix-rain {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, 
    rgba(0,0,0,0) 0%, 
    rgba(0,20,0,0.3) 50%, 
    rgba(0,0,0,0) 100%
  );
}

/* Brighter Matrix Columns */
.matrix-column {
  position: absolute;
  top: -100%;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: bold;
  text-shadow: 
    0 0 5px #00ff00,
    0 0 10px #00ff00,
    0 0 20px #00ff00,
    0 0 40px #00ff00;
  animation: matrix-fall linear infinite;
  white-space: nowrap;
}

@keyframes matrix-fall {
  0% { transform: translateY(-100%); opacity: 1; }
  95% { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}

/* ==================== INTENSIFIED GLITCH EFFECTS ==================== */
.intense-glitch {
  position: relative;
  animation: glitch-skew-intense 0.3s infinite linear alternate-reverse;
}

.intense-glitch::before,
.intense-glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.intense-glitch::before {
  left: 2px;
  text-shadow: -2px 0 #ff00ff, 2px 0 #00ffff;
  clip: rect(24px, 550px, 90px, 0);
  animation: glitch-anim-intense-1 2s infinite linear alternate-reverse;
}

.intense-glitch::after {
  left: -2px;
  text-shadow: -2px 0 #00ff00, 2px 0 #ff0000;
  clip: rect(85px, 550px, 140px, 0);
  animation: glitch-anim-intense-2 2s infinite linear alternate-reverse;
}

@keyframes glitch-skew-intense {
  0% { transform: skew(0deg); filter: hue-rotate(0deg); }
  10% { transform: skew(-5deg); filter: hue-rotate(90deg); }
  20% { transform: skew(5deg); filter: hue-rotate(180deg); }
  30% { transform: skew(-3deg); filter: hue-rotate(270deg); }
  40% { transform: skew(3deg); filter: hue-rotate(360deg); }
  50% { transform: skew(0deg); filter: hue-rotate(0deg); }
  60% { transform: skew(-8deg); filter: hue-rotate(45deg); }
  70% { transform: skew(8deg); filter: hue-rotate(135deg); }
  80% { transform: skew(-2deg); filter: hue-rotate(225deg); }
  90% { transform: skew(2deg); filter: hue-rotate(315deg); }
  100% { transform: skew(0deg); filter: hue-rotate(0deg); }
}

@keyframes glitch-anim-intense-1 {
  0% { clip: rect(20px, 9999px, 15px, 0); }
  20% { clip: rect(60px, 9999px, 70px, 0); }
  40% { clip: rect(20px, 9999px, 95px, 0); }
  60% { clip: rect(80px, 9999px, 5px, 0); }
  80% { clip: rect(10px, 9999px, 40px, 0); }
  100% { clip: rect(50px, 9999px, 90px, 0); }
}

@keyframes glitch-anim-intense-2 {
  0% { clip: rect(65px, 9999px, 99px, 0); }
  20% { clip: rect(10px, 9999px, 85px, 0); }
  40% { clip: rect(45px, 9999px, 20px, 0); }
  60% { clip: rect(90px, 9999px, 60px, 0); }
  80% { clip: rect(15px, 9999px, 35px, 0); }
  100% { clip: rect(70px, 9999px, 10px, 0); }
}

/* ==================== MAX HEADROOM EFFECTS ==================== */
.max-headroom-theme {
  --max-primary: #ffaa00;
  --max-secondary: #ff0044;
  --max-glow: #ffaa0080;
}

.max-headroom-glitch {
  position: relative;
  color: #ffaa00;
  text-shadow: 
    0 0 10px #ffaa00,
    0 0 20px #ffaa00,
    0 0 40px #ff0044;
  animation: max-stutter 0.1s infinite;
}

@keyframes max-stutter {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  50% { transform: translateX(2px); }
  75% { transform: translateX(-1px); }
}

.max-headroom-scanlines {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15),
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 9998;
  animation: scanline-flicker 0.15s infinite;
}

@keyframes scanline-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.98; }
}

.max-headroom-static {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9997;
  opacity: 0.08;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  animation: static-noise 0.5s steps(5) infinite;
}

@keyframes static-noise {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-2px, 2px); }
  50% { transform: translate(2px, -2px); }
  75% { transform: translate(-1px, -1px); }
}

/* Retro CRT Screen Effect */
.crt-screen {
  position: relative;
  overflow: hidden;
}

.crt-screen::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(0,0,0,0) 0%,
    rgba(0,0,0,0.4) 100%
  );
  pointer-events: none;
  z-index: 9996;
}

/* VHS Tracking Lines */
.vhs-tracking {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9995;
  opacity: 0.3;
}

.vhs-tracking::before {
  content: '';
  position: absolute;
  top: -100%;
  left: 0;
  width: 100%;
  height: 20px;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(255, 170, 0, 0.3),
    rgba(255, 0, 68, 0.3),
    transparent
  );
  animation: vhs-roll 3s linear infinite;
}

@keyframes vhs-roll {
  0% { top: -10%; }
  100% { top: 110%; }
}

/* Neon Glow Intensifier */
.neon-intense {
  text-shadow:
    0 0 5px currentColor,
    0 0 10px currentColor,
    0 0 20px currentColor,
    0 0 40px currentColor,
    0 0 80px currentColor;
  animation: neon-pulse 1.5s ease-in-out infinite;
}

@keyframes neon-pulse {
  0%, 100% { opacity: 1; text-shadow: 0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor; }
  50% { opacity: 0.8; text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor, 0 0 80px currentColor; }
}

/* Screen Flicker */
.screen-flicker {
  animation: flicker 0.15s infinite;
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  92% { opacity: 1; }
  93% { opacity: 0.8; }
  94% { opacity: 1; }
  96% { opacity: 0.9; }
  97% { opacity: 1; }
}
`;

content = content + intenseEffects;

fs.writeFileSync(cssFile, content);
console.log('Added intensified effects:');
console.log('- Brighter Matrix rain (70% opacity)');
console.log('- Intense glitch with color shifting');
console.log('- Max Headroom scanlines and static');
console.log('- VHS tracking lines');
console.log('- Neon pulse effects');
console.log('- Screen flicker animation');
