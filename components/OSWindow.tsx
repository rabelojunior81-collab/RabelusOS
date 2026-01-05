
import React, { useState, useRef } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import { AppId } from '../types';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';

interface OSWindowProps {
  id: AppId;
  title: string;
  children: React.ReactNode;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

export const OSWindow: React.FC<OSWindowProps> = ({ id, title, children }) => {
  const { windows, focusApp, closeApp, minimizeApp, maximizeApp, updateWindowPosition, updateWindowGeometry } = useWindowManager();
  const winState = windows[id];
  const isMobile = window.innerWidth < 768;

  // --- REFS FOR GLOBAL EVENT TRACKING ---
  const dragRef = useRef({
      isActive: false,
      startX: 0,
      startY: 0,
      initialWinX: 0,
      initialWinY: 0
  });

  const resizeRef = useRef({
      isActive: false,
      direction: null as ResizeDirection,
      startX: 0,
      startY: 0,
      initialX: 0,
      initialY: 0,
      initialW: 0,
      initialH: 0
  });

  const [isResizingVisual, setIsResizingVisual] = useState(false);
  
  // --- DRAG LOGIC (TITLE BAR) ---
  const handleDragStart = (e: React.PointerEvent) => {
    if (winState.isMaximized && isMobile) return; 
    
    // Crucial: Only Drag if left click/touch
    if (e.button !== 0) return;

    // Double click to maximize check (Native manual implementation for better control)
    if (!isMobile && e.detail === 2) {
        maximizeApp(id);
        return;
    }

    e.preventDefault();
    focusApp(id);
    
    // Pointer capture ensures we don't lose the drag if mouse moves fast
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    let initialX = winState.position.x;
    let initialY = winState.position.y;

    // "Snap out" of maximize logic
    if (winState.isMaximized && !isMobile) {
        const ratio = e.clientX / window.innerWidth;
        const newW = winState.size.width;
        initialX = e.clientX - (newW * ratio);
        initialY = e.clientY - 10;
        maximizeApp(id);
        updateWindowPosition(id, initialX, initialY);
    }

    dragRef.current = {
        isActive: true,
        startX: e.clientX,
        startY: e.clientY,
        initialWinX: initialX,
        initialWinY: initialY
    };

    window.addEventListener('pointermove', handleGlobalDragMove);
    window.addEventListener('pointerup', handleGlobalDragUp);
  };

  const handleGlobalDragMove = (e: PointerEvent) => {
      if (!dragRef.current.isActive) return;
      e.preventDefault();
      
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      
      const newX = dragRef.current.initialWinX + deltaX;
      const newY = dragRef.current.initialWinY + deltaY;

      updateWindowPosition(id, newX, newY);
  };

  const handleGlobalDragUp = (e: PointerEvent) => {
      // Release capture if possible
      try {
        const target = e.target as HTMLElement;
        if (target && target.releasePointerCapture && e.pointerId) {
            target.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}

      dragRef.current.isActive = false;
      window.removeEventListener('pointermove', handleGlobalDragMove);
      window.removeEventListener('pointerup', handleGlobalDragUp);
  };

  // --- RESIZE LOGIC (EDGES) ---
  const handleResizeStart = (e: React.PointerEvent, dir: ResizeDirection) => {
      e.preventDefault();
      e.stopPropagation(); // Stop bubbling to title bar
      focusApp(id);
      
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsResizingVisual(true);

      resizeRef.current = {
          isActive: true,
          direction: dir,
          startX: e.clientX,
          startY: e.clientY,
          initialX: winState.position.x,
          initialY: winState.position.y,
          initialW: winState.size.width,
          initialH: winState.size.height
      };

      window.addEventListener('pointermove', handleGlobalResizeMove);
      window.addEventListener('pointerup', handleGlobalResizeUp);
  };

  const handleGlobalResizeMove = (e: PointerEvent) => {
      if (!resizeRef.current.isActive) return;
      e.preventDefault();

      const { direction, startX, startY, initialX, initialY, initialW, initialH } = resizeRef.current;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newX = initialX;
      let newY = initialY;
      let newW = initialW;
      let newH = initialH;

      const MIN_W = isMobile ? 220 : 300;
      const MIN_H = 180;

      if (direction?.includes('e')) {
          newW = Math.max(MIN_W, initialW + deltaX);
      }
      if (direction?.includes('w')) {
          const proposedW = initialW - deltaX;
          if (proposedW >= MIN_W) {
              newW = proposedW;
              newX = initialX + deltaX;
          }
      }

      if (direction?.includes('s')) {
          newH = Math.max(MIN_H, initialH + deltaY);
      }
      if (direction?.includes('n')) {
          const proposedH = initialH - deltaY;
          if (proposedH >= MIN_H) {
              newH = proposedH;
              newY = initialY + deltaY;
          }
      }

      // Max width clamp
      if (newW > window.innerWidth) newW = window.innerWidth;
      
      updateWindowGeometry(id, newX, newY, newW, newH);
  };

  const handleGlobalResizeUp = (e: PointerEvent) => {
      try {
        const target = e.target as HTMLElement;
        if (target && target.releasePointerCapture && e.pointerId) {
            target.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}

      setIsResizingVisual(false);
      resizeRef.current.isActive = false;
      window.removeEventListener('pointermove', handleGlobalResizeMove);
      window.removeEventListener('pointerup', handleGlobalResizeUp);
  };


  if (!winState || !winState.isOpen) return null;

  // --- STYLES ---
  
  const getGeometryStyle = (): React.CSSProperties => {
      if (isMobile && winState.isMaximized) {
          return {
              top: 40, left: 0, right: 0, bottom: 90,
              position: 'fixed', width: '100%', height: 'auto',
              borderRadius: 0, zIndex: winState.zIndex
          };
      }
      if (winState.isMaximized) {
          return { 
              top: 38, left: 6, right: 6, bottom: 90, 
              position: 'fixed', width: 'auto', height: 'auto', 
              borderRadius: 10, zIndex: winState.zIndex
          };
      }
      return { 
          top: winState.position.y, left: winState.position.x, 
          width: winState.size.width, height: winState.size.height, 
          position: 'absolute', borderRadius: 10, zIndex: winState.zIndex
      };
  };

  const baseStyle: React.CSSProperties = {
    transition: (dragRef.current.isActive || resizeRef.current.isActive) 
        ? 'none' 
        : 'transform 0.3s ease, width 0.3s ease, height 0.3s ease, top 0.3s ease, left 0.3s ease',
    pointerEvents: 'auto',
    touchAction: 'none'
  };

  /* 
     RESIZE ZONES CONFIGURATION 
     Strategy: "Outer Halo". Hit zones extend OUTWARDS.
     Z-Index 50: Above TitleBar (Z=20) to capture edges, BUT below Traffic Lights (Z=60).
  */
  const HANDLE_THICKNESS = 30; // Larger for easier grab
  const HANDLE_OFFSET = -20;   // Halo size
  
  const ResizeZone = ({ dir, style }: { dir: ResizeDirection, style: React.CSSProperties }) => (
      <div 
          onPointerDown={(e) => handleResizeStart(e, dir)}
          className="absolute z-[50] bg-transparent touch-none"
          style={style}
      />
  );

  return (
    <div 
        className={`
            glass-window glass-texture flex flex-col overflow-hidden relative
            ${winState.isMinimized ? 'window-minimized' : 'window-visible'}
            ${winState.isMaximized ? 'shadow-none ring-0' : ''}
            ${isResizingVisual ? 'ring-1 ring-glass-accent shadow-glass-hover' : ''}
        `}
        style={{ ...baseStyle, ...getGeometryStyle() }}
        onPointerDown={() => focusApp(id)}
    >
        {/* 1. TRAFFIC LIGHTS (Z=60) - Absolute Top Left Priority */}
        <div 
            className="absolute top-[10px] left-[12px] z-[60] flex items-center gap-[6px] group"
            onPointerDown={(e) => e.stopPropagation()} 
        >
             <button 
                onClick={() => closeApp(id)} 
                className="w-[24px] h-[24px] md:w-[11px] md:h-[11px] rounded-full bg-[#FF5F56] border border-[#E0443E]/30 flex items-center justify-center text-black/50 transition-all hover:bg-[#ff5f56] active:brightness-90 shadow-inner cursor-pointer"
            >
                <X className="w-3 h-3 md:w-1.5 md:h-1.5 opacity-60 md:opacity-0 group-hover:opacity-100 text-black/70" strokeWidth={3} />
            </button>
            <button 
                onClick={() => minimizeApp(id)} 
                className="w-[24px] h-[24px] md:w-[11px] md:h-[11px] rounded-full bg-[#FFBD2E] border border-[#DEA123]/30 flex items-center justify-center text-black/50 transition-all hover:bg-[#ffbd2e] active:brightness-90 shadow-inner cursor-pointer"
            >
                <Minus className="w-3 h-3 md:w-1.5 md:h-1.5 opacity-60 md:opacity-0 group-hover:opacity-100 text-black/70" strokeWidth={3} />
            </button>
            <button 
                onClick={() => maximizeApp(id)} 
                className="w-[24px] h-[24px] md:w-[11px] md:h-[11px] rounded-full bg-[#27C93F] border border-[#1AAB29]/30 flex items-center justify-center text-black/50 transition-all hover:bg-[#27c93f] active:brightness-90 shadow-inner cursor-pointer"
            >
                {winState.isMaximized 
                    ? <Minimize2 className="w-3 h-3 md:w-1.5 md:h-1.5 opacity-60 md:opacity-0 group-hover:opacity-100 text-black/70" strokeWidth={3} />
                    : <Maximize2 className="w-3 h-3 md:w-1.5 md:h-1.5 opacity-60 md:opacity-0 group-hover:opacity-100 text-black/70" strokeWidth={3} />
                }
            </button>
        </div>

        {/* 2. RESIZE HANDLES (Z=50) */}
        {!winState.isMaximized && (
            <>
                <ResizeZone dir="n" style={{ top: HANDLE_OFFSET, left: 0, right: 0, height: HANDLE_THICKNESS, cursor: 'n-resize' }} />
                <ResizeZone dir="s" style={{ bottom: HANDLE_OFFSET, left: 0, right: 0, height: HANDLE_THICKNESS, cursor: 's-resize' }} />
                <ResizeZone dir="w" style={{ left: HANDLE_OFFSET, top: 0, bottom: 0, width: HANDLE_THICKNESS, cursor: 'w-resize' }} />
                <ResizeZone dir="e" style={{ right: HANDLE_OFFSET, top: 0, bottom: 0, width: HANDLE_THICKNESS, cursor: 'e-resize' }} />
                
                <ResizeZone dir="nw" style={{ top: HANDLE_OFFSET, left: HANDLE_OFFSET, width: HANDLE_THICKNESS * 2, height: HANDLE_THICKNESS * 2, cursor: 'nw-resize', zIndex: 55 }} />
                <ResizeZone dir="ne" style={{ top: HANDLE_OFFSET, right: HANDLE_OFFSET, width: HANDLE_THICKNESS * 2, height: HANDLE_THICKNESS * 2, cursor: 'ne-resize', zIndex: 55 }} />
                <ResizeZone dir="sw" style={{ bottom: HANDLE_OFFSET, left: HANDLE_OFFSET, width: HANDLE_THICKNESS * 2, height: HANDLE_THICKNESS * 2, cursor: 'sw-resize', zIndex: 55 }} />
                <ResizeZone dir="se" style={{ bottom: HANDLE_OFFSET, right: HANDLE_OFFSET, width: HANDLE_THICKNESS * 2, height: HANDLE_THICKNESS * 2, cursor: 'se-resize', zIndex: 55 }} />
            </>
        )}

        {/* 3. TITLE BAR (Z=20) - Draggable Area */}
        <div 
            className="h-[38px] flex items-center justify-center px-3 shrink-0 select-none relative z-[20] bg-white/5 border-b border-white/5"
            onPointerDown={handleDragStart}
            onDoubleClick={() => !isMobile && maximizeApp(id)}
            style={{ touchAction: 'none' }}
        >
            <div className="text-[10px] font-medium tracking-widest text-glass-text/80 pointer-events-none uppercase opacity-70">
                {title}
            </div>
        </div>

        {/* 4. CONTENT (Z=10) */}
        <div className="flex-1 overflow-hidden relative bg-black/10 z-[10]">
            {children}
        </div>
    </div>
  );
};
