
import React, { useState, useEffect, useRef } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import { useAppStore } from '../context/AppStoreContext';
import { AppId } from '../types';
import { DOCK_PINNED_APPS } from '../utils/constants';

export const Dock: React.FC = () => {
  const { openApp, windows, apps } = useWindowManager();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [baseSize, setBaseSize] = useState(50); // Base icon size

  // Adjust base size for mobile vs desktop
  useEffect(() => {
      const handleResize = () => setBaseSize(window.innerWidth < 768 ? 42 : 50);
      handleResize(); // Init
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Prepare Lists
  const pinnedApps = DOCK_PINNED_APPS
    .map(id => apps.find(a => a.id === id))
    .filter(Boolean);

  const runningApps = Object.keys(windows)
    .filter(id => windows[id as AppId]?.isOpen && !DOCK_PINNED_APPS.includes(id as AppId))
    .map(id => apps.find(a => a.id === id))
    .filter(Boolean);

  // 2. Combine for Unified Indexing (Wave Effect works across divider)
  const dockItems = [
      ...pinnedApps.map(app => ({ type: 'app' as const, data: app! })),
      ...(runningApps.length > 0 ? [{ type: 'divider' as const, id: 'dock-divider' }] : []),
      ...runningApps.map(app => ({ type: 'app' as const, data: app! }))
  ];

  const handleContextMenu = (e: React.MouseEvent, appId: string, label: string) => {
      e.preventDefault();
      e.stopPropagation(); 
      const event = new CustomEvent('doctor-context-menu', {
          detail: { x: e.clientX, y: e.clientY, type: 'app', targetId: appId, label: label }
      });
      document.dispatchEvent(event);
  };

  const getIconGradient = (id: string) => {
      switch(id) {
          case 'trading': return 'from-[#2563EB] to-[#06B6D4]';
          case 'news': return 'from-[#DC2626] to-[#F97316]';
          case 'dashboard': return 'from-[#334155] to-[#475569]';
          case 'store': return 'from-[#059669] to-[#10B981]';
          case 'settings': return 'from-[#4B5563] to-[#6B7280]';
          case 'youtube': return 'from-[#E11D48] to-[#be123c]';
          default: return 'from-[#4F46E5] to-[#8B5CF6]';
      }
  };

  // --- Animation Logic ---
  const calculateStyle = (index: number) => {
      // Default State
      if (hoveredIndex === null) {
          return {
              width: `${baseSize}px`,
              height: `${baseSize}px`,
              transform: 'translateY(0px)',
              margin: '0 6px'
          };
      }

      // Magnification Physics
      const distance = Math.abs(hoveredIndex - index);
      let scale = 1;
      let translateY = 0;

      if (distance === 0) {
          scale = 1.5;
          translateY = -20;
      } else if (distance <= 1) { // 1
          scale = 1.3;
          translateY = -12;
      } else if (distance <= 2) { // 2
          scale = 1.15;
          translateY = -5;
      }

      const size = baseSize * scale;
      
      return {
          width: `${size}px`,
          height: `${size}px`,
          transform: `translateY(${translateY}px)`,
          margin: `0 ${6 * scale}px`, // Scale margin slightly to prevent crowd
          zIndex: 100 - distance // Ensure centered item is on top
      };
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9000] perspective-1000 w-auto max-w-full px-4">
      <div 
        className="
            flex items-end justify-center px-3 pb-3 pt-2 rounded-[20px] 
            bg-[#080808]/40 backdrop-blur-[40px] backdrop-saturate-[180%]
            border border-white/10 shadow-glass
            transition-all duration-300 ease-liquid
        "
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {dockItems.map((item, index) => {
            const style = calculateStyle(index);

            // --- DIVIDER ---
            if (item.type === 'divider') {
                return (
                    <div 
                        key="divider"
                        className="mx-2 bg-white/10 rounded-full transition-all duration-200 ease-liquid"
                        style={{
                            width: '2px',
                            height: `${parseFloat(style.height) * 0.8}px`, // 80% height of neighbors
                            marginBottom: '6px' // Align visually
                        }}
                    />
                );
            }

            // --- APP ICON ---
            const app = item.data;
            if (!app) return null;

            const isOpen = windows[app.id]?.isOpen;
            const isMinimized = windows[app.id]?.isMinimized;

            return (
                <button
                    key={app.id}
                    onClick={() => { openApp(app.id); setHoveredIndex(null); }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onContextMenu={(e) => handleContextMenu(e, app.id, app.label)}
                    className="relative group focus:outline-none transition-all duration-200 ease-liquid flex flex-col items-center justify-end"
                    style={style}
                >
                    {/* Tooltip (Dynamic Position) */}
                    <div 
                        className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-glass-base/90 border border-white/10 rounded-[8px] text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl backdrop-blur-md"
                        style={{ transform: `translateX(-50%) scale(${1 / (parseInt(style.width)/baseSize)})` }} // Counter-scale tooltip text? Optional, but keeping it simple.
                    >
                        {app.label}
                    </div>

                    {/* Icon Container */}
                    <div className={`
                        w-full h-full rounded-[14px] flex items-center justify-center shadow-dock-tile relative overflow-hidden
                        bg-gradient-to-b ${getIconGradient(app.id)}
                        transition-all duration-300
                        ${isOpen && !isMinimized ? 'brightness-110 ring-1 ring-white/20' : 'brightness-100'}
                    `}>
                        {/* Shine Effects */}
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-white/60 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/10 opacity-50 pointer-events-none"></div>
                        
                        <app.icon 
                            className="text-white drop-shadow-md relative z-10" 
                            style={{ width: '50%', height: '50%' }} 
                            strokeWidth={2} 
                        />
                    </div>

                    {/* Active Indicator Dot */}
                    <div className={`
                        absolute -bottom-2 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]
                        transition-all duration-300
                        ${isOpen && !isMinimized ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                    `}></div>
                </button>
            );
        })}
      </div>
    </div>
  );
};
