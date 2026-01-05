
import React from 'react';
import { LucideIcon } from 'lucide-react';

export type AppId = 'dashboard' | 'trading' | 'news' | 'youtube' | 'settings' | 'browser' | 'christian_ai' | 'joaca_ai' | 'logus_ai' | 'didata_ai' | 'store' | 'hermes_ai' | 'helena_ai' | 'joaca_pro' | 'profile' | 'talia_ai' | 'fatima_ai' | 'enok_ai' | 'hub' | 'notepad' | 'excelsior_ai' | 'tubemaster_ai';

export interface AppDefinition {
  id: AppId;
  label: string;
  icon: LucideIcon;
  component: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
}

export interface StoreItem extends Omit<AppDefinition, 'component'> {
  description: string;
  price: number;
  category: 'app' | 'course' | 'ai' | 'lab';
  isWebLink?: boolean; // For courses that open in new tab
  url?: string; // For external links
  rating?: number; // New: visual fake rating
  downloads?: string; // New: visual fake downloads
  screenshots?: string[]; // New: visual mock screenshots
}

export interface WindowState {
  id: AppId;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface Wallpaper {
  id: string;
  name: string;
  url: string;
  thumb?: string;
}

export interface ThemePreferences {
  accentColor: string;      // Cor principal (Botões, detalhes)
  textColor: string;        // Cor do texto principal
  glassOpacity: number;     // 0.1 a 1.0 (Translucidez)
  blurStrength: number;     // px (Desfoque do fundo)
  borderColor: string;      // Cor das bordas
  baseColor: string;        // NOVA: Cor base da janela (Tintura do vidro)
  highContrast: boolean;    // NOVA: Modo de acessibilidade
}

export interface WindowContextType {
  windows: Record<AppId, WindowState>;
  registerApp: (app: AppDefinition) => void;
  openApp: (id: AppId, params?: any) => void;
  closeApp: (id: AppId) => void;
  minimizeApp: (id: AppId) => void;
  maximizeApp: (id: AppId) => void;
  focusApp: (id: AppId) => void;
  updateWindowPosition: (id: AppId, x: number, y: number) => void;
  updateWindowSize: (id: AppId, width: number, height: number) => void;
  updateWindowGeometry: (id: AppId, x: number, y: number, width: number, height: number) => void;
  apps: AppDefinition[];
  activeAppId: AppId | null;
  
  // Wallpaper
  wallpaper: string;
  setWallpaper: (url: string) => void;
  
  // Theme Engine
  theme: ThemePreferences;
  setTheme: (theme: Partial<ThemePreferences>) => void;
  resetTheme: () => void;

  activeTabSettings?: string;
}
