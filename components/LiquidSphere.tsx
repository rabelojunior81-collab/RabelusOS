
import React, { useRef, useEffect } from 'react';
import { AudioStreamer } from '../utils/audioStreamer';

interface LiquidSphereProps {
  state: 'idle' | 'active';
  streamer: AudioStreamer | null;
  width?: number;
  height?: number;
}

export const LiquidSphere: React.FC<LiquidSphereProps> = ({ state, streamer, width = 400, height = 400 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Configuration based on state
  const getConfig = (avgFrequency: number) => {
    // Dynamically adjust parameters based on audio volume (avgFrequency 0-255)
    const intensity = Math.max(0.1, avgFrequency / 100); 

    if (state === 'active') {
        // Cyan/Electric look when active
        return {
            colorCore: '#06b6d4',
            colorOuter: '#0891b2',
            speed: 0.05 + (intensity * 0.1),
            amplitude: 10 + (intensity * 40),
            spikes: 3 + Math.floor(intensity * 4)
        };
    } else {
        // Idle / Disconnected (Grey/Obsidian)
        return {
            colorCore: '#94a3b8',
            colorOuter: '#475569',
            speed: 0.02,
            amplitude: 5,
            spikes: 3
        };
    }
  };

  const drawBlob = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    radius: number, 
    color: string, 
    offset: number,
    config: any
  ) => {
    ctx.beginPath();
    for (let i = 0; i <= 360; i += 10) {
      const angle = (i * Math.PI) / 180;
      // Organic noise formula using mixed sines
      const noise = Math.sin(angle * config.spikes + timeRef.current * config.speed + offset) * 
                    Math.cos(angle * 2 + timeRef.current * config.speed * 0.5);
      
      const r = radius + noise * config.amplitude;
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);
      
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  useEffect(() => {
    if (streamer && streamer.analyser) {
        dataArrayRef.current = new Uint8Array(streamer.analyser.frequencyBinCount);
    }
  }, [streamer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      timeRef.current += 1;
      
      let avg = 0;
      if (streamer && dataArrayRef.current) {
          streamer.getAnalyserData(dataArrayRef.current);
          const sum = dataArrayRef.current.reduce((a, b) => a + b, 0);
          avg = sum / dataArrayRef.current.length;
      }

      // If disconnected/idle, force low avg
      if (state === 'idle') avg = 0;

      const config = getConfig(avg);

      // Clear
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = width * 0.25;

      // Glow Effect
      ctx.shadowBlur = avg > 10 ? 40 : 10;
      ctx.shadowColor = config.colorCore;
      
      ctx.globalCompositeOperation = 'source-over';
      
      // 1. Darker Base Blob
      drawBlob(ctx, centerX, centerY, baseRadius + 5, config.colorOuter, 0, config);

      // 2. Main Color Blob (Slightly offset phase)
      ctx.globalCompositeOperation = 'lighten';
      drawBlob(ctx, centerX, centerY, baseRadius, config.colorCore, 2, config);

      // 3. Highlight Blob (Inner, brighter)
      ctx.globalCompositeOperation = 'overlay';
      const gradient = ctx.createRadialGradient(centerX - 20, centerY - 20, 5, centerX, centerY, baseRadius);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Reset
      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 0;

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [state, width, height, streamer]);

  return (
    <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="w-full h-full object-contain pointer-events-none"
    />
  );
};
