const fs = require('fs');

const cssFile = '/var/www/ai-generator/client/src/cyberpunk-atlantean.css';
let content = fs.readFileSync(cssFile, 'utf8');

const matrixStyles = `

/* ==================== MATRIX RAIN & GLITCH EFFECTS ==================== */

/* Matrix Glitch Effect for Title */
.matrix-glitch {
  position: relative;
  animation: glitch-skew 1s infinite linear alternate-reverse;
}

.matrix-glitch::before,
.matrix-glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.matrix-glitch::before {
  left: 2px;
  text-shadow: -2px 0 #00ff00;
  clip: rect(44px, 450px, 56px, 0);
  animation: glitch-anim 5s infinite linear alternate-reverse;
}

.matrix-glitch::after {
  left: -2px;
  text-shadow: -2px 0 #ff00ff;
  clip: rect(44px, 450px, 56px, 0);
  animation: glitch-anim2 5s infinite linear alternate-reverse;
}

@keyframes glitch-anim {
  0% { clip: rect(31px, 9999px, 94px, 0); }
  10% { clip: rect(112px, 9999px, 76px, 0); }
  20% { clip: rect(85px, 9999px, 77px, 0); }
  30% { clip: rect(27px, 9999px, 97px, 0); }
  40% { clip: rect(64px, 9999px, 22px, 0); }
  50% { clip: rect(19px, 9999px, 89px, 0); }
  60% { clip: rect(93px, 9999px, 11px, 0); }
  70% { clip: rect(46px, 9999px, 53px, 0); }
  80% { clip: rect(7px, 9999px, 67px, 0); }
  90% { clip: rect(58px, 9999px, 33px, 0); }
  100% { clip: rect(12px, 9999px, 88px, 0); }
}

@keyframes glitch-anim2 {
  0% { clip: rect(65px, 9999px, 99px, 0); }
  10% { clip: rect(23px, 9999px, 45px, 0); }
  20% { clip: rect(88px, 9999px, 12px, 0); }
  30% { clip: rect(41px, 9999px, 78px, 0); }
  40% { clip: rect(96px, 9999px, 34px, 0); }
  50% { clip: rect(15px, 9999px, 56px, 0); }
  60% { clip: rect(73px, 9999px, 21px, 0); }
  70% { clip: rect(38px, 9999px, 92px, 0); }
  80% { clip: rect(52px, 9999px, 16px, 0); }
  90% { clip: rect(84px, 9999px, 43px, 0); }
  100% { clip: rect(29px, 9999px, 71px, 0); }
}

@keyframes glitch-skew {
  0% { transform: skew(0deg); }
  10% { transform: skew(-2deg); }
  20% { transform: skew(2deg); }
  30% { transform: skew(0deg); }
  40% { transform: skew(-1deg); }
  50% { transform: skew(1deg); }
  60% { transform: skew(0deg); }
  70% { transform: skew(-2deg); }
  80% { transform: skew(2deg); }
  90% { transform: skew(0deg); }
  100% { transform: skew(-1deg); }
}

/* Matrix Scanline Effect */
.matrix-scanline {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(255,255,255,0),
    rgba(255,255,255,0) 50%,
    rgba(0,255,0,0.02) 50%,
    rgba(0,255,0,0.02)
  );
  background-size: 100% 4px;
  pointer-events: none;
  z-index: 9999;
  animation: scanline 10s linear infinite;
}

@keyframes scanline {
  0% { transform: translateY(0); }
  100% { transform: translateY(100vh); }
}

/* Glow Effects */
.matrix-glow {
  text-shadow: 
    0 0 5px #00ff00,
    0 0 10px #00ff00,
    0 0 20px #00ff00,
    0 0 40px #00ff00;
}

/* Binary Rain Background */
.binary-rain {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: -2;
  opacity: 0.1;
}

.binary-column {
  position: absolute;
  top: -100%;
  color: #00ff00;
  font-family: monospace;
  font-size: 14px;
  line-height: 14px;
  animation: binary-fall linear infinite;
  text-shadow: 0 0 5px #00ff00;
}

@keyframes binary-fall {
  0% { transform: translateY(0); }
  100% { transform: translateY(200vh); }
}

/* Terminal Cursor Effect */
.terminal-cursor::after {
  content: '█';
  animation: cursor-blink 1s infinite;
  color: #00ff00;
}

@keyframes cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Holographic Card Effect */
.holographic-card {
  position: relative;
  background: linear-gradient(135deg, rgba(0,20,0,0.9), rgba(0,40,0,0.8));
  border: 1px solid #00ff00;
  box-shadow: 
    0 0 10px rgba(0,255,0,0.3),
    inset 0 0 20px rgba(0,255,0,0.1);
  overflow: hidden;
}

.holographic-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 40%,
    rgba(0,255,0,0.1) 50%,
    transparent 60%
  );
  animation: holographic-shine 3s infinite;
}

@keyframes holographic-shine {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

/* Circuit Board Pattern Overlay */
.circuit-pattern {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(90deg, rgba(0,255,0,0.03) 1px, transparent 1px),
    linear-gradient(rgba(0,255,0,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: -1;
}

/* Digital Noise Effect */
.digital-noise {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9998;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

/* Status Indicators */
.status-online {
  color: #00ff00;
  text-shadow: 0 0 10px #00ff00;
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Loading Animation - Matrix Style */
.matrix-loading {
  position: relative;
  overflow: hidden;
}

.matrix-loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0,255,0,0.4), transparent);
  animation: matrix-loading 2s infinite;
}

@keyframes matrix-loading {
  0% { left: -100%; }
  100% { left: 100%; }
}
`;

content = content + matrixStyles;

fs.writeFileSync(cssFile, content);
console.log('Added Matrix rain CSS styles with glitch effects!');
console.log('- Matrix glitch animations');
console.log('- Scanline effects');
console.log('- Holographic cards');
console.log('- Digital noise overlay');
console.log('- Circuit board patterns');
