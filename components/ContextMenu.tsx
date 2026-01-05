

import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw, Monitor, Info, Power, LayoutGrid, ExternalLink, Trash2 } from 'lucide-react';
import { useWindowManager } from '../context/WindowManagerContext';
import { useAppStore } from '../context/AppStoreContext';
import { useGamification } from '../context/GamificationContext'; 
import { AppId } from '../types';
import { SYSTEM_APP_IDS } from '../utils/constants';

interface ContextMenuData {
  x: number;
  y: number;
  type?: 'desktop' | 'app';
  targetId?: AppId;
  label?: string;
}

export const ContextMenu: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<ContextMenuData>({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { openApp, closeApp } = useWindowManager();
  const { uninstallApp } = useAppStore();
  const { logout } = useGamification(); 

  useEffect(() => {
    // 1. Standard Desktop Right Click
    const handleContextMenu = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      e.preventDefault();
      openMenu({ x: e.clientX, y: e.clientY, type: 'desktop' });
    };

    // 2. Custom Event from Dock or specific elements
    const handleCustomContext = (e: Event) => {
        const customEvent = e as CustomEvent<ContextMenuData>;
        openMenu(customEvent.detail);
    };

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('doctor-context-menu', handleCustomContext);
    document.addEventListener('click', handleClick);
    
    return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('doctor-context-menu', handleCustomContext);
        document.removeEventListener('click', handleClick);
    };
  }, []);

  const openMenu = (menuData: ContextMenuData) => {
      setVisible(true);
      setData(menuData);
  };

  const handleUninstall = () => {
      if (data.targetId) {
          closeApp(data.targetId);
          uninstallApp(data.targetId);
      }
  };

  const handleLogout = () => {
      logout();
      setVisible(false);
  };

  const handleOrganizeIcons = () => {
      window.dispatchEvent(new CustomEvent('organize-icons'));
      setVisible(false);
  };

  if (!visible) return null;

  // --- POSITIONING LOGIC ---
  const menuHeight = 220; 
  const isBottom = data.y + menuHeight > window.innerHeight;
  
  const style: React.CSSProperties = {
      left: data.x,
      top: isBottom ? 'auto' : data.y,
      bottom: isBottom ? window.innerHeight - data.y : 'auto',
      transformOrigin: isBottom ? 'bottom left' : 'top left'
  };

  // --- MENU ITEMS HELPER ---
  const MenuItem = ({ icon: Icon, label, shortcut, onClick, danger }: any) => (
    <button 
        onClick={() => { onClick?.(); setVisible(false); }}
        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-[6px] text-xs transition-colors group
            ${danger 
                ? 'text-red-400 hover:bg-red-500 hover:text-white' 
                : 'text-glass-text hover:bg-glass-accent hover:text-black'
            }
        `}
    >
        <div className="flex items-center gap-2">
            <Icon className={`w-3.5 h-3.5 ${danger ? 'text-red-400 group-hover:text-white' : 'text-glass-muted group-hover:text-black/70'}`} />
            <span className="font-medium">{label}</span>
        </div>
        {shortcut && <span className="text-[10px] opacity-50 font-mono">{shortcut}</span>}
    </button>
  );

  const isSystemApp = data.targetId && SYSTEM_APP_IDS.includes(data.targetId as AppId);

  return (
    <div 
        ref={menuRef}
        className="fixed z-[10000] w-56 bg-glass-base border border-glass-border rounded-tahoe p-1.5 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200 shadow-2xl backdrop-blur-xl transition-colors ring-1 ring-white/10"
        style={style}
    >
        <div className="px-3 py-1 text-[10px] font-bold text-glass-muted uppercase tracking-widest border-b border-glass-border mb-1">
            {data.label || 'Rabelus System'}
        </div>
        
        {data.type === 'app' ? (
            <>
                <MenuItem icon={ExternalLink} label="Abrir Aplicativo" onClick={() => data.targetId && openApp(data.targetId)} />
                <div className="h-px bg-glass-border my-0.5" />
                <MenuItem icon={Info} label="Informações" />
                {!isSystemApp && (
                    <MenuItem icon={Trash2} label="Desinstalar" danger onClick={handleUninstall} />
                )}
            </>
        ) : (
            <>
                <MenuItem icon={RefreshCw} label="Atualizar Interface" shortcut="⌘R" onClick={() => window.location.reload()} />
                <MenuItem icon={Monitor} label="Personalizar" onClick={() => openApp('settings', { tab: 'appearance' })} />
                <div className="h-px bg-glass-border my-0.5" />
                {/* Changed from Terminal to Organize Icons */}
                <MenuItem icon={LayoutGrid} label="Organizar Ícones" onClick={handleOrganizeIcons} />
                <MenuItem icon={ExternalLink} label="Rabelus Web" onClick={() => window.open('https://google.com', '_blank')} />
                <div className="h-px bg-glass-border my-0.5" />
                <MenuItem icon={Info} label="Sobre o Sistema" onClick={() => openApp('settings', { tab: 'general' })} />
                <MenuItem icon={Power} label="Encerrar Sessão" danger onClick={handleLogout} />
            </>
        )}
    </div>
  );
};