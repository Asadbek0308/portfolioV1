import React, { useEffect, useRef } from 'react';

export default function CursorGrid() {
  const canvasRef = useRef(null);
  const trailsRef = useRef([]);

  const COLS = 20;
  const ROWS = 12;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      // Device pixel ratio handles scaling for crisp edges on high-res displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e) => {
      // Calculate sizes based on viewport dimensions
      const cellWidth = window.innerWidth / COLS;
      const cellHeight = window.innerHeight / ROWS;

      const col = Math.floor(e.clientX / cellWidth);
      const row = Math.floor(e.clientY / cellHeight);

      const cellKey = `${col}-${row}`;

      // Throttle inputs: only push if the block isn't already highly opaque
      const exists = trailsRef.current.some(t => t.key === cellKey && t.alpha > 0.8);
      
      if (!exists && col >= 0 && col < COLS && row >= 0 && row < ROWS) {
        trailsRef.current.push({
          key: cellKey,
          x: col * cellWidth,
          y: row * cellHeight,
          width: cellWidth,
          height: cellHeight,
          alpha: 1.0
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId;
    const render = () => {
      // Clear using logical viewport sizing matching the scale transform
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // 1. Single-pass drawing and tracking loop
      // Dropping splice avoids index shifts and array re-allocation penalties
      const activeTrails = [];

      for (let i = 0; i < trailsRef.current.length; i++) {
        const cell = trailsRef.current[i];
        
        ctx.fillStyle = `rgba(255, 255, 255, ${cell.alpha})`;
        // ctx.fillStyle = `rgba(0, 255, 255, ${cell.alpha})`;
        ctx.fillRect(cell.x + 0.5, cell.y + 0.5, cell.width - 1, cell.height - 1);

        cell.alpha -= 0.025; // Controls the length of the trailing fade

        if (cell.alpha > 0) {
          activeTrails.push(cell);
        }
      }

      trailsRef.current = activeTrails;
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen pointer-events-none select-none will-change-transform"
      style={{
        zIndex: 9999,
        mixBlendMode: 'difference',
        width: '100vw',
        height: '100vh'
      }}
    />
  );
}

// https://pxpush.com/