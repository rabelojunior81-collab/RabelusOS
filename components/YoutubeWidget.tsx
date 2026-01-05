
import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, GripHorizontal, Settings, MousePointer2, Youtube, Square, Minimize2, Scaling, Pin, PinOff, Search } from 'lucide-react';
import { useWindowManager } from '../context/WindowManagerContext';

type ViewMode = 'MINI' | 'THEATER' | 'FULL';

// Default Neutral Playlist (Lofi Girl - Safe, Aesthetic)
const DEFAULT_VIDEO_ID = 'jfKfPfyJRdk'; 
const STORAGE_KEY_LIVE_ID = 'rabelus_live_id';
const STORAGE_KEY_MODE = 'rabelus_live_active';
const STORAGE_KEY_PINNED = 'rabelus_media_pinned';

export const YoutubeWidget: React.FC = () => {
  // --- Native System Integration ---
  const { windows, closeApp, minimizeApp, updateWindowPosition, updateWindowSize, focusApp } = useWindowManager();
  const winState = windows['youtube'];

  // --- Local UI State ---
  const [viewMode, setViewMode] = useState<ViewMode>('MINI');
  
  const [isPinned, setIsPinned] = useState(() => {
      const saved = localStorage.getItem(STORAGE_KEY_PINNED);
      return saved !== null ? saved === 'true' : true; // Default to Pinned
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ w: 0, h: 0, x: 0, y: 0 });

  // --- Logic State ---
  const [currentId, setCurrentId] = useState(DEFAULT_VIDEO_ID);
  
  const [showSettings, setShowSettings] = useState(false);
  const [interactionEnabled, setInteractionEnabled] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [parseError, setParseError] = useState('');

  const interactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY_LIVE_ID);
    if (savedId) setCurrentId(savedId);
  }, []);

  // --- VIEW MODE & PIN EFFECT LOGIC ---
  useEffect(() => {
    if (!winState) return;

    if (viewMode === 'THEATER') {
        const theaterW = 800;
        const theaterH = 500;
        updateWindowSize('youtube', theaterW, theaterH);

        // If Pinned, force Center
        if (isPinned) {
            const cx = (window.innerWidth - theaterW) / 2;
            const cy = (window.innerHeight - theaterH) / 2;
            updateWindowPosition('youtube', cx, cy);
        }
    } else if (viewMode === 'MINI') {
        const miniW = 420;
        const miniH = 240;
        
        // Reset to default mini size if coming from Theater
        if (winState.size.width === 800) {
            updateWindowSize('youtube', miniW, miniH);
        }

        // If Pinned, force Top Right Position
        if (isPinned) {
            const topBarHeight = 32;
            const padding = 20;
            const tx = window.innerWidth - (winState.size.width === 800 ? miniW : winState.size.width) - padding;
            const ty = topBarHeight + padding;
            updateWindowPosition('youtube', tx, ty);
        }
    }
  }, [viewMode, isPinned, winState?.size.width]); 

  const togglePin = () => {
      const newState = !isPinned;
      setIsPinned(newState);
      localStorage.setItem(STORAGE_KEY_PINNED, String(newState));
  };

  // --- DRAG LOGIC (Linked to WindowManager) ---
  const handleMouseDownDrag = (e: React.MouseEvent) => {
    // Disable dragging if Pinned or Fullscreen
    if (viewMode === 'FULL' || isPinned || !winState) return;
    
    focusApp('youtube');
    setIsDragging(true);
    setDragOffset({ 
        x: e.clientX - winState.position.x, 
        y: e.clientY - winState.position.y 
    });
  };

  // --- RESIZE LOGIC (Linked to WindowManager) ---
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!winState || isPinned) return; 
    focusApp('youtube');
    setIsResizing(true);
    setResizeStart({ 
        w: winState.size.width, 
        h: winState.size.height, 
        x: e.clientX, 
        y: e.clientY 
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateWindowPosition('youtube', e.clientX - dragOffset.x, e.clientY - dragOffset.y);
      }
      
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newW = Math.max(320, resizeStart.w + deltaX);
        const newH = Math.max(180, resizeStart.h + deltaY);
        updateWindowSize('youtube', newW, newH);
      }
    };
    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isDragging ? 'grabbing' : 'se-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, updateWindowPosition, updateWindowSize]);

  if (!winState || !winState.isOpen) return null;

  // --- LOGIC HELPER ---
  const extractVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleUpdateSource = () => {
    const extracted = extractVideoId(inputUrl);
    if (extracted) {
      setCurrentId(extracted);
      setShowSettings(false);
      localStorage.setItem(STORAGE_KEY_LIVE_ID, extracted);
      setInputUrl(''); 
      setParseError('');
    } else {
      setParseError('Link do YouTube inválido.');
    }
  };

  const unlockInteraction = () => {
    if (interactionEnabled) return;
    setInteractionEnabled(true);
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = setTimeout(() => setInteractionEnabled(false), 15000);
  };

  const getContainerStyle = () => {
    if (viewMode === 'FULL') {
      return { inset: 0, width: '100vw', height: '100vh', borderRadius: 0 };
    }
    return { 
      left: winState.position.x, 
      top: winState.position.y, 
      width: winState.size.width,
      height: winState.isMinimized ? '40px' : winState.size.height,
      borderRadius: '12px'
    };
  };

  const getIframeSrc = () => {
    const commonParams = "autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&playsinline=1";
    // Check if it's a playlist or video
    return `https://www.youtube.com/embed/${currentId}?${commonParams}`;
  };

  return (
    <div 
      className={`fixed transition-all duration-300 shadow-2xl flex flex-col pointer-events-auto ${viewMode === 'FULL' ? 'z-[9999]' : ''}`}
      style={{ ...getContainerStyle(), zIndex: winState.zIndex }}
      onMouseDown={() => focusApp('youtube')}
    >
      <div className={`
        flex-1 flex flex-col overflow-hidden w-full h-full relative
        bg-glass-base backdrop-blur-xl border border-glass-border shadow-glass
        ${viewMode === 'FULL' ? 'rounded-none border-0' : 'rounded-lg'}
        ${interactionEnabled ? 'ring-2 ring-glass-profit' : isPinned ? 'ring-1 ring-glass-accent/50' : 'ring-1 ring-glass-border'}
      `}>
        
        {(isDragging || isResizing) && <div className="absolute inset-0 z-50 bg-transparent"></div>}

        {/* HEADER */}
        <div 
          className={`
            h-9 bg-glass-panel border-b border-glass-border flex items-center justify-between px-3 shrink-0 select-none text-glass-text
            ${isPinned ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
          `}
          onMouseDown={handleMouseDownDrag}
        >
          <div className="flex items-center gap-3">
             <GripHorizontal className={`w-4 h-4 text-glass-muted opacity-50 ${isPinned || viewMode !== 'MINI' ? 'hidden' : ''}`} />
             <div className="flex items-center gap-2 px-2 py-0.5 bg-glass-secondary/50 border border-glass-border rounded shadow-sm">
                <Youtube className="w-3 h-3 text-red-500" />
                <span className="text-[9px] font-black text-glass-text uppercase tracking-wider">Rabelus Media</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-glass-text" onMouseDown={e => e.stopPropagation()}>
            <button 
                onClick={togglePin} 
                className={`p-1.5 rounded transition-colors ${isPinned ? 'bg-glass-accent/20 text-glass-accent hover:bg-glass-accent/30' : 'hover:bg-white/10 text-glass-muted'}`}
                title={isPinned ? "Desafixar Janela" : "Fixar Janela"}
            >
                {isPinned ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
            </button>

            <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded hover:bg-white/10 transition-colors"><Search className="w-3.5 h-3.5" /></button>
            
            {viewMode === 'MINI' && <button onClick={() => setViewMode('THEATER')} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Modo Teatro"><Square className="w-3.5 h-3.5" /></button>}
            {viewMode !== 'MINI' && <button onClick={() => setViewMode('MINI')} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Mini Player"><Minimize2 className="w-3.5 h-3.5" /></button>}
            
            <button onClick={() => minimizeApp('youtube')} className="p-1.5 rounded hover:bg-white/10 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
            <button onClick={() => closeApp('youtube')} className="p-1.5 rounded hover:bg-red-500 hover:text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className={`relative bg-black flex-1 w-full ${winState.isMinimized ? 'hidden' : 'flex'}`}>
            
            {/* SETTINGS OVERLAY */}
            {showSettings && (
                <div className="absolute inset-0 z-30 bg-glass-base/95 backdrop-blur-xl p-6 overflow-y-auto animate-in fade-in duration-200 flex flex-col justify-center">
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-glass-muted uppercase tracking-widest flex items-center gap-2">
                            <Search className="w-3 h-3" /> Alterar Fonte de Mídia
                        </label>
                        <div className="flex gap-2">
                            <input 
                                value={inputUrl} 
                                onChange={e => setInputUrl(e.target.value)} 
                                className="w-full text-xs p-2.5 rounded bg-glass-secondary border border-glass-border text-glass-text focus:border-glass-accent outline-none font-mono placeholder:text-glass-muted/50" 
                                placeholder="Cole link do YouTube (Vídeo/Live)" 
                            />
                            <button onClick={handleUpdateSource} className="bg-glass-accent text-black px-4 rounded font-bold text-xs hover:bg-white transition-colors">OK</button>
                        </div>
                        {parseError && <div className="text-red-400 text-[10px] font-bold bg-red-400/10 p-2 rounded border border-red-400/20">{parseError}</div>}
                        
                        <div className="pt-4 border-t border-white/10 mt-4">
                             <button onClick={() => { setCurrentId(DEFAULT_VIDEO_ID); setShowSettings(false); localStorage.removeItem(STORAGE_KEY_LIVE_ID); }} className="text-[10px] text-glass-muted hover:text-glass-accent flex items-center gap-2 transition-colors">
                                 <Settings className="w-3 h-3" /> Restaurar Padrão (Lofi Mode)
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {/* INTERACTION BLOCKER */}
            {!interactionEnabled && !showSettings && (
                <div 
                    className={`absolute inset-0 z-20 bg-transparent ${isPinned ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                    title="Clique em 'Interagir' para liberar controles"
                    onMouseDown={handleMouseDownDrag}
                ></div>
            )}
            
            <iframe 
                width="100%" 
                height="100%" 
                src={getIframeSrc()} 
                title="Rabelus Media" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen 
                className="w-full h-full object-cover bg-black" 
            />
        </div>

        {/* FOOTER CONTROLS */}
        {!winState.isMinimized && (
            <div className="h-8 bg-glass-panel border-t border-glass-border flex items-center justify-between px-2 shrink-0 relative text-glass-text">
                 <div className="flex items-center gap-2 text-[9px] font-mono text-glass-muted opacity-70 pl-2">
                     <span className={`w-1.5 h-1.5 rounded-full ${interactionEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                     {interactionEnabled ? 'CONTROLES: UNLOCKED' : 'CONTROLES: LOCKED'}
                 </div>
                 
                 <button 
                    onClick={unlockInteraction} 
                    disabled={interactionEnabled} 
                    className={`
                        px-3 py-1 rounded-[4px] text-[9px] font-bold uppercase transition-all
                        ${interactionEnabled 
                            ? 'bg-glass-profit/10 text-glass-profit border border-glass-profit/20 cursor-default' 
                            : 'bg-glass-accent/10 text-glass-accent border border-glass-accent/20 hover:bg-glass-accent hover:text-black'
                        }
                    `}
                >
                    {interactionEnabled ? 'Interagindo...' : <span className="flex items-center gap-1"><MousePointer2 className="w-3 h-3" /> Liberar</span>}
                </button>
            </div>
        )}

        {/* RESIZE HANDLE (Only if not pinned and in mini mode) */}
        {!winState.isMinimized && viewMode === 'MINI' && !isPinned && (
            <div 
                className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-50 flex items-end justify-end p-0.5 opacity-50 hover:opacity-100"
                onMouseDown={handleMouseDownResize}
            >
                <Scaling className="w-4 h-4 text-glass-accent fill-current" />
            </div>
        )}

      </div>
    </div>
  );
};
