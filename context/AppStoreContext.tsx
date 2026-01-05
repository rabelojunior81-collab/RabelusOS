
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppId } from '../types';
import { SYSTEM_APP_IDS } from '../utils/constants';

interface AppStoreContextType {
  installedApps: AppId[];
  installApp: (id: AppId) => void;
  uninstallApp: (id: AppId) => void;
  isInstalled: (id: AppId) => boolean;
}

const AppStoreContext = createContext<AppStoreContextType | undefined>(undefined);

const STORAGE_KEY = 'rabelus_installed_apps';

// Default Apps (Minimalist Rabelus Suite)
const DEFAULT_APPS: AppId[] = [
    'hub',        // System Core
    'youtube',    // Media Module
    'notepad',    // Text Editor
    'store',      // Pinned
    'settings',   // Pinned
    'news'        // Pinned
];

export const AppStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [installedApps, setInstalledApps] = useState<AppId[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      let apps = saved ? JSON.parse(saved) : DEFAULT_APPS;
      
      // Auto-Healing: Ensure all SYSTEM_APP_IDS are always present
      // This fixes the issue where new system apps (like Hub or Notepad) don't appear for existing users
      const missingSystemApps = SYSTEM_APP_IDS.filter(id => !apps.includes(id));
      if (missingSystemApps.length > 0) {
          apps = [...apps, ...missingSystemApps];
      }
      
      return apps;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(installedApps));
  }, [installedApps]);

  const installApp = (id: AppId) => {
    if (!installedApps.includes(id)) {
        setInstalledApps(prev => [...prev, id]);
    }
  };

  const uninstallApp = (id: AppId) => {
    // Check against strict System IDs to prevent accidental core removal
    if (SYSTEM_APP_IDS.includes(id)) return;
    
    setInstalledApps(prev => prev.filter(appId => appId !== id));
  };

  const isInstalled = (id: AppId) => installedApps.includes(id);

  return (
    <AppStoreContext.Provider value={{ installedApps, installApp, uninstallApp, isInstalled }}>
      {children}
    </AppStoreContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within a AppStoreProvider');
  }
  return context;
};
