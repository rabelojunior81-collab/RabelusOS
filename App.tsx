
import React, { useEffect, useState, useRef } from 'react';
import { WindowManagerProvider, useWindowManager } from './context/WindowManagerContext';
import { GamificationProvider, useGamification } from './context/GamificationContext';
import { AppStoreProvider, useAppStore } from './context/AppStoreContext';
import { TopBar } from './components/TopBar';
import { Dock } from './components/Dock';
import { OSWindow } from './components/OSWindow';
import { ContextMenu } from './components/ContextMenu';
import { YoutubeWidget } from './components/YoutubeWidget';
import { SplashScreen } from './components/SplashScreen';
import { APP_REGISTRY } from './utils/appsRegistry';
import { DOCK_PINNED_APPS } from './utils/constants';

// --- DRAGGABLE DESKTOP ICON COMPONENT ---
interface DraggableDesktopIconProps {
    id: string;
    label: string;
    icon: React.ElementType;
    position: { x: number; y: number };
    isSelected: boolean;
    onPointerDown: (e: React.PointerEvent) => void;
    onDoubleClick: () => void;
    isOpen: boolean;
    colorStyle: string;
}

const DraggableDesktopIcon: React.FC<DraggableDesktopIconProps> = ({ 
    id, label, icon: Icon, position, isSelected, onPointerDown, onDoubleClick, isOpen, colorStyle 
}) => {
    // Color extraction for shadow/glow based on the passed style class
    const getGlowColor = () => {
        if (colorStyle.includes('red') || colorStyle.includes('rose')) return 'rgba(239,68,68,0.6)'; // Red
        if (colorStyle.includes('blue') || colorStyle.includes('cyan')) return 'rgba(59,130,246,0.6)'; // Blue
        if (colorStyle.includes('orange')) return 'rgba(249,115,22,0.6)'; // Orange
        return 'rgba(255,255,255,0.4)'; // Default
    };
    
    // Tap Logic ref
    const tapRef = useRef({ time: 0, x: 0, y: 0 });

    const handlePointerDownInternal = (e: React.PointerEvent) => {
        // Record tap start
        tapRef.current = { time: Date.now(), x: e.clientX, y: e.clientY };
        
        // Stop propagation to prevent desktop selection clearing
        e.stopPropagation(); 
        
        // Pass to parent handler for selection/dragging logic
        onPointerDown(e);
    };

    const handlePointerUpInternal = (e: React.PointerEvent) => {
        // Smart "Tap" Detection logic
        // If movement is very small and duration is short, treat as Tap/Click
        const duration = Date.now() - tapRef.current.time;
        const dist = Math.sqrt(
            Math.pow(e.clientX - tapRef.current.x, 2) + 
            Math.pow(e.clientY - tapRef.current.y, 2)
        );

        // Mobile Tap Rule: < 500ms duration, < 10px movement
        // This allows dragging to still function if the user holds or moves
        if (e.pointerType === 'touch' && duration < 500 && dist < 10) {
            onDoubleClick(); // Execute open command immediately
        }
    };

    return (
        <div 
            className="absolute z-10 flex flex-col items-center gap-2 w-24 cursor-pointer pointer-events-auto select-none group touch-none"
            style={{ left: position.x, top: position.y }}
            onPointerDown={handlePointerDownInternal}
            onPointerUp={handlePointerUpInternal}
            onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
        >
             {/* Icon Container with Liquid Glass Effect */}
             <div 
                className={`
                    relative w-16 h-16 rounded-[18px] flex items-center justify-center 
                    transition-all duration-200 ease-out border
                    ${isSelected 
                        ? 'border-white/40 bg-white/20 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                        : 'border-white/10 hover:bg-white/10 hover:border-white/20'
                    }
                `}
                style={{
                    boxShadow: isOpen 
                        ? `0 0 25px ${getGlowColor()}` 
                        : isSelected
                            ? '0 0 10px rgba(255,255,255,0.2)'
                            : 'none'
                }}
             >
                {/* Background Gradient - Dynamic per App */}
                <div className={`
                    absolute inset-0 rounded-[18px] backdrop-blur-md transition-opacity duration-300 bg-gradient-to-br
                    ${colorStyle}
                    ${isSelected ? 'opacity-90' : 'opacity-80 group-hover:opacity-90'}
                `}></div>
                
                {/* Gloss Effect */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-[18px] pointer-events-none"></div>

                {/* Main Icon */}
                <Icon 
                    className={`
                        relative z-10 w-8 h-8 transition-all duration-300 text-white drop-shadow-md
                        ${isSelected ? 'scale-110' : 'group-hover:scale-105'}
                    `} 
                    strokeWidth={1.5}
                />

                {/* Status Indicator Dot (On Icon for Desktop) */}
                {isOpen && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-glass-profit rounded-full border-2 border-black shadow-lg animate-pulse"></div>
                )}
             </div>

             {/* Text Label */}
             <div className={`
                px-2 py-0.5 rounded-[4px] 
                text-[11px] font-bold text-white text-shadow-sm text-center leading-tight tracking-wide
                transition-all duration-200
                ${isSelected 
                    ? 'bg-[#0058d0] text-white' 
                    : 'group-hover:bg-black/40'
                }
             `}>
                {label}
             </div>
        </div>
    );
};

// --- DESKTOP MANAGER ---
const DesktopManager: React.FC = () => {
    const { openApp, windows, apps } = useWindowManager();
    const { installedApps } = useAppStore();

    // 1. Identify Desktop Apps
    const desktopAppIds = installedApps.filter(id => !DOCK_PINNED_APPS.includes(id));
    
    // 2. Positions State
    const [positions, setPositions] = useState<Record<string, {x: number, y: number}>>({});
    
    // 3. Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectionBox, setSelectionBox] = useState<{ start: {x:number, y:number}, current: {x:number, y:number} } | null>(null);

    // 4. Drag State
    const [dragState, setDragState] = useState<{ 
        active: boolean, 
        startPointer: {x:number, y:number}, 
        initialPositions: Record<string, {x:number, y:number}>,
        pointerId: number
    } | null>(null);

    // Helper: Grid Calculation
    const START_X = 30;
    const START_Y = 60;
    const GAP_Y = 110;
    const COL_GAP_X = 100;
    const ITEMS_PER_COL = 6;

    const getGridPosition = (index: number) => {
         const col = Math.floor(index / ITEMS_PER_COL);
         const row = index % ITEMS_PER_COL;
         return { x: START_X + (col * COL_GAP_X), y: START_Y + (row * GAP_Y) };
    };

    // Initialize Positions
    useEffect(() => {
        setPositions(prev => {
             const newPos = { ...prev };
             let changed = false;
             desktopAppIds.forEach((id, idx) => {
                 if (!newPos[id]) {
                     newPos[id] = getGridPosition(idx);
                     changed = true;
                 }
             });
             return changed ? newPos : prev;
        });
    }, [desktopAppIds.length]); 

    // Listen for "Organize Icons" event
    useEffect(() => {
        const handleOrganize = () => {
            const newPos: any = {};
            desktopAppIds.forEach((id, idx) => {
                newPos[id] = getGridPosition(idx);
            });
            setPositions(newPos);
        };
        window.addEventListener('organize-icons', handleOrganize);
        return () => window.removeEventListener('organize-icons', handleOrganize);
    }, [desktopAppIds]);

    // --- POINTER HANDLERS (UNIFIED TOUCH/MOUSE) ---

    // 1. Container Pointer Down (Start Selection Box)
    const handleContainerPointerDown = (e: React.PointerEvent) => {
         if (!e.isPrimary) return;

         setSelectedIds([]); 
         setSelectionBox({
             start: { x: e.clientX, y: e.clientY },
             current: { x: e.clientX, y: e.clientY }
         });
         (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    // 2. Icon Pointer Down (Start Drag or Select)
    const handleIconPointerDown = (e: React.PointerEvent, id: string) => {
        if (!e.isPrimary) return;
        
        // Prevent container from receiving this event
        e.stopPropagation(); 
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        let newSelection = [...selectedIds];
        
        // Multi-select modifier logic (Desktop only)
        if (e.metaKey || e.ctrlKey || e.shiftKey) {
            if (newSelection.includes(id)) {
                newSelection = newSelection.filter(x => x !== id);
            } else {
                newSelection.push(id);
            }
        } else {
            // If clicking an unselected icon without modifier, reset selection to just this one
            if (!newSelection.includes(id)) {
                newSelection = [id];
            }
        }
        
        setSelectedIds(newSelection);

        // Prepare Dragging
        const currentPosSnapshot: Record<string, {x:number, y:number}> = {};
        newSelection.forEach(selId => {
            if (positions[selId]) currentPosSnapshot[selId] = { ...positions[selId] };
        });

        setDragState({
            active: true,
            startPointer: { x: e.clientX, y: e.clientY },
            initialPositions: currentPosSnapshot,
            pointerId: e.pointerId
        });
    };

    // 3. Global Pointer Move & Up (Attached to window via useEffect or handler on container)
    // We attach to container via onPointerMove/Up
    
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!e.isPrimary) return;

        // A. Handling Drag of Icons
        if (dragState && dragState.active && dragState.pointerId === e.pointerId) {
            e.preventDefault(); // Prevent scrolling while dragging
            const deltaX = e.clientX - dragState.startPointer.x;
            const deltaY = e.clientY - dragState.startPointer.y;

            setPositions(prev => {
                const next = { ...prev };
                Object.keys(dragState.initialPositions).forEach(id => {
                    next[id] = {
                        x: dragState.initialPositions[id].x + deltaX,
                        y: dragState.initialPositions[id].y + deltaY
                    };
                });
                return next;
            });
        }

        // B. Handling Selection Box Update
        if (selectionBox) {
            setSelectionBox(prev => prev ? ({ ...prev, current: { x: e.clientX, y: e.clientY } }) : null);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!e.isPrimary) return;

        // End Drag
        if (dragState && dragState.pointerId === e.pointerId) {
            setDragState(null);
            try {
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            } catch (e) { /* ignore if not captured */ }
        }

        // End Selection Box
        if (selectionBox) {
            const x1 = Math.min(selectionBox.start.x, e.clientX);
            const y1 = Math.min(selectionBox.start.y, e.clientY);
            const x2 = Math.max(selectionBox.start.x, e.clientX);
            const y2 = Math.max(selectionBox.start.y, e.clientY);

            const newSelected: string[] = [];
            
            desktopAppIds.forEach(id => {
                const pos = positions[id];
                if (!pos) return;
                const iconW = 90; 
                const iconH = 100;
                
                if (
                    x1 < pos.x + iconW &&
                    x2 > pos.x &&
                    y1 < pos.y + iconH &&
                    y2 > pos.y
                ) {
                    newSelected.push(id);
                }
            });

            if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
                setSelectedIds(newSelected);
            }
            
            setSelectionBox(null);
            try {
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            } catch (e) { /* ignore */ }
        }
    };


    // Helper to determine color style (Visual Flair)
    const getAppColorStyle = (id: string) => {
        switch(id) {
            case 'youtube': return 'from-red-900/90 to-red-600/90';
            case 'trading': return 'from-blue-900/90 to-cyan-600/90';
            case 'news': return 'from-orange-900/90 to-amber-600/90';
            default: return 'from-slate-800/90 to-slate-600/90';
        }
    };

    return (
        <div 
            className="absolute inset-0 z-10 overflow-hidden touch-none"
            onPointerDown={handleContainerPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ pointerEvents: 'auto' }} 
        >
             {/* Render Selection Box */}
             {selectionBox && (
                 <div 
                    className="absolute bg-blue-500/20 border border-blue-500/50 z-50 pointer-events-none rounded-[4px] backdrop-blur-[1px]"
                    style={{
                        left: Math.min(selectionBox.start.x, selectionBox.current.x),
                        top: Math.min(selectionBox.start.y, selectionBox.current.y),
                        width: Math.abs(selectionBox.current.x - selectionBox.start.x),
                        height: Math.abs(selectionBox.current.y - selectionBox.start.y)
                    }}
                 />
             )}

             <div className="w-full h-full relative">
                 {desktopAppIds.map((appId) => {
                     const appDef = apps.find(a => a.id === appId);
                     if (!appDef) return null;

                     const pos = positions[appId] || { x: -200, y: -200 }; // Hide until init
                     const isSelected = selectedIds.includes(appId);

                     return (
                         <DraggableDesktopIcon 
                            key={appId}
                            id={appId}
                            label={appDef.label}
                            icon={appDef.icon}
                            position={pos}
                            isSelected={isSelected}
                            onPointerDown={(e) => handleIconPointerDown(e, appId)}
                            onDoubleClick={() => openApp(appId as any)}
                            isOpen={!!windows[appId as any]?.isOpen}
                            colorStyle={getAppColorStyle(appId)}
                         />
                     );
                 })}
             </div>
        </div>
    );
};

const DesktopEnvironment: React.FC = () => {
    const { registerApp, windows, wallpaper } = useWindowManager();
    const { installedApps } = useAppStore();

    useEffect(() => {
        installedApps.forEach(appId => {
            const appDef = APP_REGISTRY[appId];
            if (appDef) {
                registerApp(appDef);
            }
        });
    }, [registerApp, installedApps]);

    return (
        <div 
            className="w-screen h-screen overflow-hidden relative selection:bg-glass-accent selection:text-black transition-all duration-700 ease-in-out bg-cover bg-center animate-in fade-in duration-1000 touch-none"
            style={{ backgroundImage: `url(${wallpaper})` }}
        >
            <div className="absolute inset-0 bg-black/20 pointer-events-none transition-opacity duration-500 z-0"></div>

            <TopBar />
            
            {/* Desktop Icons Layer - Now Handles Touch */}
            <DesktopManager />

            {/* Window Layer */}
            <div className="absolute inset-0 top-8 bottom-20 z-20 pointer-events-none">
                 <div className="w-full h-full relative">
                    {Object.values(windows).map(win => {
                        // Special Handling for Youtube Widget (Frameless/Custom Frame)
                        if (win.id === 'youtube') {
                            return <YoutubeWidget key="youtube-widget" />;
                        }

                        const appDef = APP_REGISTRY[win.id];
                        if (!appDef) return null;

                        return (
                            <OSWindow key={win.id} id={win.id} title={appDef.label}>
                                {appDef.component}
                            </OSWindow>
                        );
                    })}
                 </div>
            </div>

            <Dock />
            <ContextMenu />
        </div>
    );
};

const RootController: React.FC = () => {
    const { username, hasOnboarded, completeOnboarding } = useGamification();
    const [bootComplete, setBootComplete] = useState(false);

    if (bootComplete) {
        return <DesktopEnvironment />;
    }

    return (
        <SplashScreen 
            hasSession={hasOnboarded}
            savedName={username}
            onComplete={(name) => {
                completeOnboarding(name);
                setBootComplete(true);
            }} 
        />
    );
};

const App: React.FC = () => {
  return (
    <WindowManagerProvider>
      <AppStoreProvider>
        <GamificationProvider>
            <RootController />
        </GamificationProvider>
      </AppStoreProvider>
    </WindowManagerProvider>
  );
};

export default App;
