const fs = require('fs');

const cssFile = '/var/www/ai-generator/client/src/cyberpunk-atlantean.css';
let content = fs.readFileSync(cssFile, 'utf8');

// Add new HUD styles at the end
const newStyles = `

/* ==================== REAL-TIME PROGRESS HUD ==================== */

.progress-container-hud {
  margin-top: 24px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(0, 20, 40, 0.95) 0%, rgba(10, 10, 30, 0.98) 100%);
  border: 2px solid #00f5ff;
  border-radius: 8px;
  box-shadow: 0 0 30px rgba(0, 245, 255, 0.3), inset 0 0 30px rgba(0, 245, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.progress-container-hud::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00f5ff, transparent);
  animation: scanLine 2s linear infinite;
}

@keyframes scanLine {
  0% { left: -100%; }
  100% { left: 100%; }
}

.hud-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.hud-title {
  font-family: 'Orbitron', sans-serif !important;
  font-weight: 700 !important;
  font-size: 0.9rem !important;
  color: #00f5ff !important;
  letter-spacing: 0.2em !important;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.8);
}

.hud-percentage {
  font-family: 'Orbitron', sans-serif !important;
  font-weight: 700 !important;
  font-size: 1.2rem !important;
  color: #ff00ff !important;
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.8);
}

.progress-bar-container {
  position: relative;
  height: 24px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 245, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.cyberpunk-progress-hud {
  height: 100% !important;
  background-color: rgba(0, 245, 255, 0.2) !important;
}

.cyberpunk-progress-hud .MuiLinearProgress-bar {
  background: linear-gradient(90deg, #00f5ff, #ff00ff, #00f5ff) !important;
  background-size: 200% 100% !important;
  animation: progressGradient 2s linear infinite;
  box-shadow: 0 0 20px rgba(0, 245, 255, 0.8);
}

@keyframes progressGradient {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.progress-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px);
  background-size: 20px 100%;
  pointer-events: none;
}

.status-message-hud {
  font-family: 'Roboto Mono', monospace !important;
  font-size: 0.8rem !important;
  color: #00f5ff !important;
  letter-spacing: 0.1em !important;
  text-align: center;
  margin-bottom: 16px;
  text-shadow: 0 0 5px rgba(0, 245, 255, 0.5);
}

.hud-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 245, 255, 0.2);
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-family: 'Orbitron', sans-serif !important;
  font-size: 0.6rem !important;
  color: rgba(255, 255, 255, 0.5) !important;
  letter-spacing: 0.15em !important;
  margin-bottom: 4px;
}

.stat-value {
  font-family: 'Roboto Mono', monospace !important;
  font-size: 0.9rem !important;
  color: #ff00ff !important;
  font-weight: 600 !important;
  text-shadow: 0 0 5px rgba(255, 0, 255, 0.5);
}

/* ==================== IMAGE OUTPUT STYLING ==================== */

.image-frame {
  position: relative;
  border: 2px solid #00f5ff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 245, 255, 0.3);
}

.image-frame::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 48%, rgba(0, 245, 255, 0.1) 49%, rgba(0, 245, 255, 0.1) 51%, transparent 52%);
  pointer-events: none;
  z-index: 1;
}

.generated-image {
  width: 100%;
  display: block;
  transition: transform 0.3s ease;
}

.generated-image:hover {
  transform: scale(1.02);
}

.image-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  z-index: 2;
}

.generation-details {
  margin-top: 12px;
  padding: 12px;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 245, 255, 0.2);
  border-radius: 4px;
}

.detail-text {
  display: block;
  font-family: 'Roboto Mono', monospace !important;
  font-size: 0.75rem !important;
  color: rgba(255, 255, 255, 0.7) !important;
  margin-bottom: 4px;
}

.detail-text strong {
  color: #00f5ff;
}

.system-status {
  margin-top: 16px;
  text-align: center;
}

.status-indicator {
  font-family: 'Orbitron', sans-serif !important;
  font-size: 0.7rem !important;
  color: #00ff00 !important;
  letter-spacing: 0.2em !important;
  text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
}

/* ==================== ANIMATIONS ==================== */

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pulse {
  animation: pulse 2s infinite;
}

@keyframes glitch {
  0% { clip-path: inset(40% 0 61% 0); transform: translate(-2px, 2px); }
  20% { clip-path: inset(92% 0 1% 0); transform: translate(2px, -2px); }
  40% { clip-path: inset(43% 0 1% 0); transform: translate(-2px, 2px); }
  60% { clip-path: inset(25% 0 58% 0); transform: translate(2px, -2px); }
  80% { clip-path: inset(54% 0 7% 0); transform: translate(-2px, 2px); }
  100% { clip-path: inset(58% 0 43% 0); transform: translate(2px, -2px); }
}

.glitch-effect {
  animation: glitch 0.3s infinite;
}
`;

content = content + newStyles;

fs.writeFileSync(cssFile, content);
console.log('Added HUD progress styles to CSS');
