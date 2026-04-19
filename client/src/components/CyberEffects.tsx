import { useEffect, useRef, useState } from 'react';

interface MatrixRainProps {
  opacity?: number;
}

export function MatrixRain({ opacity = 0.1 }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size once
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    const characters = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charArray = characters.split('');
    
    const fontSize = 16;
    let columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = [];
    
    // Initialize drops
    const initDrops = () => {
      columns = Math.floor(canvas.width / fontSize);
      drops.length = 0;
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
      }
    };
    initDrops();

    let animationId: number;
    let lastDraw = 0;
    const fps = 15; // Limit to 15 FPS for performance
    const fpsInterval = 1000 / fps;
    
    const draw = (timestamp: number) => {
      animationId = requestAnimationFrame(draw);
      
      const elapsed = timestamp - lastDraw;
      if (elapsed < fpsInterval) return;
      lastDraw = timestamp - (elapsed % fpsInterval);
      
      if (!isActive) return;

      // Clear with fade effect
      ctx.fillStyle = 'rgba(0, 5, 16, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      // Only process every 3rd column for performance
      for (let i = 0; i < drops.length; i += 2) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        
        // Staggered colors
        const dropMod = Math.floor(drops[i]) % 5;
        if (dropMod === 0) ctx.fillStyle = '#00f3ff';
        else if (dropMod === 1) ctx.fillStyle = '#00c8ff';
        else if (dropMod === 2) ctx.fillStyle = '#0099cc';
        else if (dropMod === 3) ctx.fillStyle = '#006699';
        else ctx.fillStyle = '#004466';
        
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    animationId = requestAnimationFrame(draw);

    const handleResize = () => {
      resizeCanvas();
      initDrops();
    };

    window.addEventListener('resize', handleResize);

    // Pause when tab is hidden
    const handleVisibility = () => {
      setIsActive(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
        opacity: opacity,
      }}
    />
  );
}

export function Scanlines() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0, 243, 255, 0.02) 3px, rgba(0, 243, 255, 0.02) 6px)',
        opacity: 0.5,
      }}
    />
  );
}

export function GridOverlay() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
        backgroundImage: `
          linear-gradient(rgba(0, 243, 255, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 243, 255, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px',
        opacity: 0.6,
      }}
    />
  );
}

// Static version for better performance during generation
export function StaticCyberBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -2,
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(0, 77, 77, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 50%, rgba(0, 26, 51, 0.3) 0%, transparent 50%),
          linear-gradient(135deg, #000510 0%, #001a33 50%, #000510 100%)
        `,
      }}
    />
  );
}