

import React, { useState, useEffect, useRef } from 'react';
import { Wifi, Battery, Search, Check, LogOut, UserCircle } from 'lucide-react';
import { useWindowManager } from '../context/WindowManagerContext';
import { useGamification } from '../context/GamificationContext';

export const TopBar: React.FC = () => {
  const { windows, apps, focusApp, activeAppId } = useWindowManager();
  const { logout, username } = useGamification();
  const [time, setTime] = useState(new Date());
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getOpenWindows = () => {
    return Object.values(windows).filter(w => w.isOpen).map(w => {
        const app = apps.find(a => a.id === w.id);
        return { ...w, label: app?.label || w.id };
    });
  };

  const renderMenuItem = (label: string, id: string) => (
    <div className="relative group h-full flex items-center">
        <span 
            className={`cursor-pointer px-3 py-0.5 rounded-[4px] hover:bg-white/10 transition-colors ${activeMenu === id ? 'bg-white/10 text-white' : 'text-glass-text/90'}`}
            onClick={() => setActiveMenu(activeMenu === id ? null : id)}
        >
            {label}
        </span>
        
        {/* Dropdown Logic */}
        {activeMenu === id && (
          <>
            {id === 'window' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#050508]/95 border border-white/10 shadow-glass rounded-[8px] py-1 backdrop-blur-2xl z-[10000] flex flex-col">
                    <div className="px-3 py-1.5 text-[9px] font-bold text-glass-muted uppercase tracking-widest border-b border-white/5">
                        Abertas
                    </div>
                    {getOpenWindows().map(w => (
                        <button 
                            key={w.id}
                            onClick={() => { focusApp(w.id); setActiveMenu(null); }}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-glass-text hover:bg-glass-accent hover:text-black transition-colors text-left"
                        >
                            <span className="w-4 flex justify-center">
                                {activeAppId === w.id && <Check className="w-3 h-3" />}
                            </span>
                            {w.label}
                        </button>
                    ))}
                    {getOpenWindows().length === 0 && (
                         <div className="px-3 py-2 text-xs text-glass-muted italic">Nenhuma janela</div>
                    )}
                </div>
            )}
            
            {id === 'file' && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-[#050508]/95 border border-white/10 shadow-2xl rounded-[8px] py-1.5 backdrop-blur-2xl z-[10000] flex flex-col animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/50">
                    <div className="px-3 py-2 text-[10px] font-bold text-glass-muted uppercase tracking-widest border-b border-white/5 mb-1 flex justify-between items-center">
                        <span>Sessão Atual</span>
                        <span className="text-glass-accent">{username}</span>
                    </div>
                    <button 
                        onClick={() => { logout(); setActiveMenu(null); }}
                        className="flex items-center gap-3 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left w-full group"
                    >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Troca de Usuário / Logout
                    </button>
                </div>
            )}
          </>
        )}
    </div>
  );

  return (
    <div 
        ref={menuRef} 
        className="fixed top-0 left-0 right-0 h-[32px] bg-[#000000]/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-3 z-[9990] text-[11px] font-medium text-glass-text shadow-sm select-none transition-colors duration-300"
    >
        
        {/* Left: Apple/System Menu */}
        <div className="flex items-center gap-3 h-full">
            <div className="flex items-center gap-2 cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded-[4px] transition-colors group">
                <span className="font-bold tracking-wide text-glass-accent">Rabelus OS</span>
            </div>
            
            <div className="hidden md:flex gap-0.5 h-full items-center">
                {renderMenuItem('Arquivo', 'file')}
                {renderMenuItem('Editar', 'edit')}
                {renderMenuItem('Visualizar', 'view')}
                {renderMenuItem('Janela', 'window')}
                {renderMenuItem('Ajuda', 'help')}
            </div>
        </div>

        {/* Right: Status */}
        <div className="flex items-center gap-3 text-glass-text/90">
            <div className="flex items-center gap-2 px-2 py-0.5 rounded-[4px] hover:bg-white/10 cursor-pointer transition-colors border border-transparent">
                <Battery className="w-3.5 h-3.5 text-glass-profit" />
                <span className="text-[10px] font-mono opacity-90">100%</span>
            </div>
            <Wifi className="w-3.5 h-3.5 hover:text-white cursor-pointer transition-colors" />
            <Search className="w-3.5 h-3.5 hover:text-white cursor-pointer transition-colors" />
            
            <div className="flex items-center gap-2 cursor-default pl-3 border-l border-white/10 h-3.5">
                <span className="opacity-80 tracking-wide">{formatDate(time)}</span>
                <span className="font-bold font-mono text-white text-shadow-sm w-12 text-center">{formatTime(time)}</span>
            </div>
        </div>
    </div>
  );
};