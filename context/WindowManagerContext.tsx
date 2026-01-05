
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { AppId, AppDefinition, WindowContextType, WindowState, ThemePreferences } from '../types';

const WindowManagerContext = createContext<WindowContextType | undefined>(undefined);

// Deep Space Default Wallpaper (Requested by User)
const DEFAULT_WALLPAPER = 'https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=2933&auto=format&fit=crop'; 

const DEFAULT_THEME: ThemePreferences = {
    accentColor: '#38BDF8', // Sky 400 (Do Print)
    textColor: '#E2E8F0',   // Slate 200 (Do Print)
    glassOpacity: 0.39,     // 61% Densidade (Slider) = 39% Opacidade
    blurStrength: 7,        // 7px (Do Print)
    borderColor: 'rgba(255, 255, 255, 0.2)', 
    baseColor: '#0F172A',   // Slate 900 (Do Print)
    highContrast: true      // Ativado (Do Print)
};

const STORAGE_KEYS = {
    WALLPAPER: 'rabelus_wallpaper',
    THEME: 'rabelus_theme',
    WINDOWS: 'rabelus_windows_state_v3',
    ACTIVE_APP: 'rabelus_active_app',
    HIGHEST_Z: 'rabelus_highest_z'
};

// Helper to convert Hex to RGB for CSS variable injection
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 5, g: 5, b: 8 };
};

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apps, setApps] = useState<AppDefinition[]>([]);
  const isMobileRef = useRef(window.innerWidth < 768);

  // Update mobile status on resize
  useEffect(() => {
    const checkMobile = () => {
        isMobileRef.current = window.innerWidth < 768;
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Initialize state from Storage or Defaults
  const [highestZ, setHighestZ] = useState(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.HIGHEST_Z);
      return saved ? parseInt(saved, 10) : 10;
  });

  const [activeAppId, setActiveAppId] = useState<AppId | null>(() => {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_APP) as AppId | null;
  });

  const [windows, setWindows] = useState<Record<AppId, WindowState>>({} as Record<AppId, WindowState>);

  // Wallpaper State
  const [wallpaper, setWallpaperState] = useState<string>(() => {
      return localStorage.getItem(STORAGE_KEYS.WALLPAPER) || DEFAULT_WALLPAPER;
  });

  // Theme State
  const [theme, setThemeState] = useState<ThemePreferences>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return saved ? JSON.parse(saved) : DEFAULT_THEME;
  });

  // Settings Deep Link State
  const [activeTabSettings, setActiveTabSettings] = useState<string>('general');

  // Persistence Timer Ref (Debounce saving to avoid lag on drag)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- PERSISTENCE LOGIC ---
  useEffect(() => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(() => {
          // Only save if we have windows to avoid wiping storage on initial empty render
          if (Object.keys(windows).length > 0) {
            localStorage.setItem(STORAGE_KEYS.WINDOWS, JSON.stringify(windows));
            localStorage.setItem(STORAGE_KEYS.HIGHEST_Z, highestZ.toString());
            if (activeAppId) localStorage.setItem(STORAGE_KEYS.ACTIVE_APP, activeAppId);
            else localStorage.removeItem(STORAGE_KEYS.ACTIVE_APP);
          }
      }, 1000); // Autosave every 1s of inactivity/change
      
      return () => {
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      };
  }, [windows, highestZ, activeAppId]);

  // --- WINDOW BOUNDARY ENFORCEMENT ---
  // Ensure windows stay visible when screen resizes
  useEffect(() => {
      const handleResize = () => {
          const screenW = window.innerWidth;
          const screenH = window.innerHeight;
          const TOP_BAR_HEIGHT = 40;
          const DOCK_AREA = 110; // Increased dock buffer for mobile

          setWindows(prev => {
              const updated = { ...prev };
              let changed = false;

              Object.keys(updated).forEach((key) => {
                  const id = key as AppId;
                  const win = updated[id];
                  if (!win || !win.isOpen) return;

                  let newX = win.position.x;
                  let newY = win.position.y;
                  let newW = win.size.width;
                  let newH = win.size.height;

                  // 1. Clamp Width/Height to Screen (Minus margins)
                  // On mobile, force max width to be screen width
                  if (newW > screenW) newW = screenW;
                  if (newH > screenH - TOP_BAR_HEIGHT) newH = screenH - TOP_BAR_HEIGHT;

                  // 2. Clamp Position (Keep visible logic)
                  // Prevent going off right edge
                  if (newX + newW > screenW) {
                      newX = Math.max(0, screenW - newW);
                  }
                  
                  // Prevent going off bottom
                  if (newY + newH > screenH - DOCK_AREA) {
                       newY = Math.max(TOP_BAR_HEIGHT, screenH - DOCK_AREA - newH); 
                  }
                  
                  // 3. Hard Stop Top/Left
                  if (newX < 0) newX = 0;
                  if (newY < TOP_BAR_HEIGHT) newY = TOP_BAR_HEIGHT;

                  if (
                      Math.abs(newX - win.position.x) > 1 || 
                      Math.abs(newY - win.position.y) > 1 || 
                      Math.abs(newW - win.size.width) > 1 || 
                      Math.abs(newH - win.size.height) > 1
                  ) {
                      updated[id] = {
                          ...win,
                          position: { x: newX, y: newY },
                          size: { width: newW, height: newH }
                      };
                      changed = true;
                  }
              });

              return changed ? updated : prev;
          });
      };

      window.addEventListener('resize', handleResize);
      // Run once on mount to fix any initial bad states from local storage
      handleResize();
      
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- THEME ENGINE ---
  useEffect(() => {
    const root = document.documentElement;
    
    // 1. Accent & Text
    root.style.setProperty('--glass-accent', theme.accentColor);
    root.style.setProperty('--glass-text', theme.textColor);
    
    // 2. High Contrast / Text Shadow Logic
    if (theme.highContrast) {
        root.style.setProperty('text-shadow', '0 1px 1px rgba(0,0,0,0.8)');
        root.style.setProperty('--glass-border', 'rgba(255,255,255,0.2)'); 
    } else {
        root.style.removeProperty('text-shadow');
        root.style.setProperty('--glass-border', theme.borderColor);
    }
    
    // 3. Dynamic Glass Base Color (The "Tint" Logic)
    const rgb = hexToRgb(theme.baseColor);
    root.style.setProperty('--glass-base', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${theme.glassOpacity})`);
    
    // 4. Panel Color - slightly lighter than base for contrast
    root.style.setProperty('--glass-panel', `rgba(${Math.min(255, rgb.r + 20)}, ${Math.min(255, rgb.g + 20)}, ${Math.min(255, rgb.b + 25)}, 0.05)`);

    // 5. Blur & Hover
    root.style.setProperty('--glass-blur', `${theme.blurStrength}px`);
    root.style.setProperty('--glass-accent-hover', theme.accentColor);
    root.style.setProperty('--glass-shadow-color', `${theme.accentColor}15`);

    localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(theme));
  }, [theme]);

  const setTheme = useCallback((newTheme: Partial<ThemePreferences>) => {
      setThemeState(prev => ({ ...prev, ...newTheme }));
  }, []);

  const resetTheme = useCallback(() => {
      setThemeState(DEFAULT_THEME);
  }, []);

  const setWallpaper = (url: string) => {
      setWallpaperState(url);
      localStorage.setItem(STORAGE_KEYS.WALLPAPER, url);
  };

  const registerApp = useCallback((app: AppDefinition) => {
    setApps(prev => {
      if (prev.find(a => a.id === app.id)) return prev;
      return [...prev, app];
    });
    
    setWindows(prev => {
        // Validation: If already in state and VALID (has size/position), skip
        const existing = prev[app.id];
        if (existing && existing.size && existing.position) return prev;

        // Try to load from Storage
        let savedState: WindowState | null = null;
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.WINDOWS);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed[app.id]) {
                    // Check validity of saved state
                    if (parsed[app.id].size && parsed[app.id].position) {
                        savedState = parsed[app.id];
                    }
                }
            }
        } catch (e) {
            console.warn("Failed to load window state", e);
        }

        // Default Dimensions (Safe for Mobile)
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const defaultW = app.defaultWidth || 800;
        const defaultH = app.defaultHeight || 600;
        
        // Ensure default size never exceeds viewport
        const safeW = Math.min(defaultW, screenW);
        const safeH = Math.min(defaultH, screenH - 80);

        // If saved state exists and is valid, restore it.
        if (savedState) {
            // Re-validate saved state against current viewport
            let restoredW = savedState.size.width;
            let restoredH = savedState.size.height;
            let restoredX = savedState.position.x;
            let restoredY = savedState.position.y;

            if (restoredW > screenW) restoredW = screenW;
            if (restoredH > screenH - 80) restoredH = screenH - 80;
            if (restoredX + restoredW > screenW) restoredX = 0;
            if (restoredY + restoredH > screenH) restoredY = 40;

            return {
                ...prev,
                [app.id]: {
                    ...savedState,
                    position: { x: restoredX, y: restoredY },
                    size: { width: restoredW, height: restoredH },
                    id: app.id // Ensure ID consistency
                }
            };
        }

        // Default Initialization (Also fixes corrupted in-memory state)
        const isMobile = isMobileRef.current;
        return {
            ...prev,
            [app.id]: {
                id: app.id,
                isOpen: existing?.isOpen ?? false, 
                isMinimized: existing?.isMinimized ?? false,
                isMaximized: existing?.isMaximized ?? (isMobile),
                zIndex: existing?.zIndex ?? 10,
                position: existing?.position ?? { x: isMobile ? 0 : 50 + (Object.keys(prev).length * 20), y: isMobile ? 40 : 50 + (Object.keys(prev).length * 20) },
                size: existing?.size ?? { width: safeW, height: safeH }
            }
        };
    });
  }, []);

  const focusApp = useCallback((id: AppId) => {
    setHighestZ(prev => prev + 1);
    setWindows(prev => {
        const win = prev[id];
        if (!win) return prev; // Guard
        return {
            ...prev,
            [id]: { ...win, zIndex: highestZ + 1, isMinimized: false }
        };
    });
    setActiveAppId(id);
  }, [highestZ]);

  const openApp = useCallback((id: AppId, params?: any) => {
    if (id === 'settings' && params?.tab) {
        setActiveTabSettings(params.tab);
    }

    setWindows(prev => {
        let win = prev[id];
        const isMobile = window.innerWidth < 768; // Check current viewport
        
        // SAFE ZONE CALCULATION
        const appDef = apps.find(a => a.id === id);
        const defaultW = appDef?.defaultWidth || 800;
        const defaultH = appDef?.defaultHeight || 600;
        
        // Ensure width never exceeds screen width (Critical fix for mobile Hub)
        const safeW = Math.min(defaultW, window.innerWidth);
        const safeH = Math.min(defaultH, window.innerHeight - 80);

        // Calculate center if strictly windowed
        const centerX = Math.max(0, (window.innerWidth - safeW) / 2);
        const centerY = Math.max(40, (window.innerHeight - safeH) / 2);

        // Self-healing: If window missing or corrupted (no size/pos)
        if (!win || !win.size) {
             if (appDef) {
                 win = {
                    id: id,
                    isOpen: true,
                    isMinimized: false,
                    isMaximized: isMobile, // Auto-maximize on mobile
                    zIndex: highestZ + 1,
                    position: { x: isMobile ? 0 : centerX, y: isMobile ? 40 : centerY },
                    size: { width: safeW, height: safeH }
                 };
                 return { ...prev, [id]: win };
             } else {
                 console.warn(`Could not open app ${id}: definition not found`);
                 return prev;
             }
        }

        const isAlreadyOpen = win.isOpen;
        if (isAlreadyOpen) {
            return {
                ...prev,
                [id]: { ...win, isMinimized: false, zIndex: highestZ + 1 }
            };
        }
        
        // Ensure that upon opening, it's visible even if it was saved off-screen
        let newX = win.position.x;
        let newY = win.position.y;
        let newW = win.size.width;
        let newH = win.size.height;

        // Force resize if stored size is larger than current screen (rotation case)
        if (newW > window.innerWidth) newW = window.innerWidth;
        if (newH > window.innerHeight - 80) newH = window.innerHeight - 80;
        
        if (newX + newW > window.innerWidth) newX = 0;
        if (newY + newH > window.innerHeight) newY = 40;
        if (newX < 0) newX = 0;
        
        return {
            ...prev,
            [id]: { 
                ...win, 
                isOpen: true, 
                zIndex: highestZ + 1, 
                isMinimized: false, 
                position: {x: newX, y: newY},
                size: {width: newW, height: newH} 
            }
        };
    });
    setHighestZ(h => h + 1);
    setActiveAppId(id);
  }, [highestZ, apps]);

  const closeApp = useCallback((id: AppId) => {
    setWindows(prev => {
        const win = prev[id];
        if (!win) return prev;
        return {
            ...prev,
            [id]: { ...win, isOpen: false }
        };
    });
    if (activeAppId === id) setActiveAppId(null);
  }, [activeAppId]);

  const minimizeApp = useCallback((id: AppId) => {
    setWindows(prev => {
        const win = prev[id];
        if (!win) return prev;
        return {
            ...prev,
            [id]: { ...win, isMinimized: true }
        };
    });
    setActiveAppId(null);
  }, []);

  const maximizeApp = useCallback((id: AppId) => {
     setWindows(prev => {
        const win = prev[id];
        if (!win) return prev;
        return {
            ...prev,
            [id]: { ...win, isMaximized: !win.isMaximized }
        };
    });
    focusApp(id);
  }, [focusApp]);

  const updateWindowPosition = useCallback((id: AppId, x: number, y: number) => {
    setWindows(prev => {
        const win = prev[id];
        if (!win) return prev;
        
        // Use a lighter constraint during dragging to avoid "fighting" the user cursor
        // Only clamp drastically if it's completely lost
        return {
            ...prev,
            [id]: { ...win, position: { x, y } }
        };
    });
  }, []);

  const updateWindowSize = useCallback((id: AppId, width: number, height: number) => {
    setWindows(prev => {
        const win = prev[id];
        if (!win) return prev;
        return {
            ...prev,
            [id]: { ...win, size: { width, height } }
        };
    });
  }, []);

  // NEW: Batch Update for Resizing (Avoids jitter when updating Pos + Size)
  const updateWindowGeometry = useCallback((id: AppId, x: number, y: number, width: number, height: number) => {
    setWindows(prev => {
        const win = prev[id];
        if (!win) return prev;
        return {
            ...prev,
            [id]: { ...win, position: { x, y }, size: { width, height } }
        };
    });
  }, []);

  return (
    <WindowManagerContext.Provider value={{ 
        windows, 
        apps, 
        registerApp, 
        openApp, 
        closeApp, 
        minimizeApp, 
        maximizeApp, 
        focusApp, 
        updateWindowPosition, 
        updateWindowSize,
        updateWindowGeometry, // Add this to type definition or just cast in component if lazy
        activeAppId,
        wallpaper,
        setWallpaper,
        theme,
        setTheme,
        resetTheme,
        activeTabSettings
    }}>
      {children}
    </WindowManagerContext.Provider>
  );
};

export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider');
  }
  return context;
};
