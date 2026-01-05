

import React, { useState, useEffect, useRef } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import { 
    Monitor, User, Info, Check, Image as ImageIcon, Shield, 
    Palette, Droplets, Sun, Moon, Eye, Contrast, Sparkles, 
    Sliders, Type, Grid, MousePointer2, Upload, Trash2, 
    Plus, Loader2
} from 'lucide-react';
import { Wallpaper } from '../types';

// Static Assets
const WALLPAPERS: Wallpaper[] = [
    { 
        id: 'obsidian_default', 
        name: 'Obsidian Flow', 
        url: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2832&auto=format&fit=crop' 
    },
    { 
        id: 'monterey', 
        name: 'Monterey Abstract', 
        url: 'https://images.unsplash.com/photo-1621619856624-42fd193a0661?q=80&w=2858&auto=format&fit=crop' 
    },
    { 
        id: 'bigsur', 
        name: 'Big Sur Coast', 
        url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2940&auto=format&fit=crop' 
    },
    {
        id: 'cyberpunk',
        name: 'Neon City',
        url: 'https://images.unsplash.com/photo-1535868463750-c78d9543614f?q=80&w=2952&auto=format&fit=crop'
    },
    {
        id: 'minimal_dark',
        name: 'Deep Space',
        url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=2933&auto=format&fit=crop'
    }
];

const PRESETS = [
    {
        id: 'obsidian',
        name: 'Rabelus Obsidian',
        icon: Moon,
        theme: {
            baseColor: '#050508',
            textColor: '#F8FAFC',
            accentColor: '#E2E8F0',
            glassOpacity: 0.92,
            blurStrength: 40,
            highContrast: true,
            borderColor: 'rgba(255, 255, 255, 0.15)'
        }
    },
    {
        id: 'midnight',
        name: 'Midnight Blue',
        icon: Eye,
        theme: {
            baseColor: '#0F172A',
            textColor: '#E2E8F0',
            accentColor: '#38BDF8',
            glassOpacity: 0.80,
            blurStrength: 10,
            highContrast: false,
            borderColor: 'rgba(56, 189, 248, 0.3)'
        }
    },
    {
        id: 'mac_light',
        name: 'Crystal Light',
        icon: Sun,
        theme: {
            baseColor: '#FFFFFF',
            textColor: '#000000',
            accentColor: '#007AFF',
            glassOpacity: 0.65,
            blurStrength: 25,
            highContrast: false,
            borderColor: 'rgba(0, 0, 0, 0.1)'
        }
    },
    {
        id: 'contrast',
        name: 'Terminal',
        icon: Contrast,
        theme: {
            baseColor: '#000000',
            textColor: '#00FF00',
            accentColor: '#00FF00',
            glassOpacity: 0.98,
            blurStrength: 0,
            highContrast: true,
            borderColor: '#00FF00'
        }
    }
];

// Extended type for user uploads
interface UserWallpaper extends Wallpaper {
    isUser?: boolean;
    timestamp?: number;
}

// Lazy Load Image Component for efficient carousel
const LazyImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    return (
        <div className={`relative overflow-hidden ${className}`}>
             <img 
                src={src} 
                alt={alt} 
                loading="lazy"
                onLoad={() => setIsLoaded(true)}
                className={`w-full h-full object-cover transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-xl'}`} 
             />
             {!isLoaded && (
                 <div className="absolute inset-0 flex items-center justify-center bg-glass-panel">
                     <Loader2 className="w-4 h-4 text-glass-muted animate-spin" />
                 </div>
             )}
        </div>
    );
};

export const SettingsScreen: React.FC = () => {
    const { wallpaper, setWallpaper, activeTabSettings, theme, setTheme } = useWindowManager();
    const [activeTab, setActiveTab] = useState('appearance');
    const [userWallpapers, setUserWallpapers] = useState<UserWallpaper[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Responsive Logic
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(1000);

    // Load User Wallpapers
    useEffect(() => {
        const saved = localStorage.getItem('rabelus_user_wallpapers');
        if (saved) {
            try {
                setUserWallpapers(JSON.parse(saved));
            } catch (e) { console.error('Error loading wallpapers', e); }
        }
    }, []);

    useEffect(() => {
        if (activeTabSettings) setActiveTab(activeTabSettings);
    }, [activeTabSettings]);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                setWidth(entries[0].contentRect.width);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const isMobile = width < 700;

    // --- HANDLERS ---

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("A imagem deve ser menor que 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            const newWallpaper: UserWallpaper = {
                id: `user_${Date.now()}`,
                name: file.name.split('.')[0],
                url: result,
                isUser: true,
                timestamp: Date.now()
            };
            const updated = [newWallpaper, ...userWallpapers];
            setUserWallpapers(updated);
            localStorage.setItem('rabelus_user_wallpapers', JSON.stringify(updated));
            setWallpaper(result); // Auto-apply
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteWallpaper = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = userWallpapers.filter(w => w.id !== id);
        setUserWallpapers(updated);
        localStorage.setItem('rabelus_user_wallpapers', JSON.stringify(updated));
        
        // If current wallpaper is deleted, revert to default
        if (wallpaper === userWallpapers.find(w => w.id === id)?.url) {
            setWallpaper(WALLPAPERS[0].url);
        }
    };

    // Transparency: Slider logic reversed (100% slider = 0% opacity)
    const transparencyValue = Math.round((1 - theme.glassOpacity) * 100);
    const handleTransparencyChange = (val: number) => {
        const opacity = 1 - (val / 100);
        // Clamp to avoid full invisibility or weird states
        setTheme({ glassOpacity: Math.max(0.05, Math.min(1, opacity)) });
    };

    // --- RENDERERS ---

    const renderSidebarItem = (id: string, label: string, Icon: any) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`
                flex items-center gap-2.5 px-3 py-2 rounded-md transition-all text-xs font-medium group relative
                ${isMobile 
                    ? 'flex-shrink-0 border border-glass-border min-w-[90px] justify-center flex-col gap-1.5 py-3' 
                    : 'w-full mb-1'
                }
                ${activeTab === id 
                    ? 'bg-glass-accent text-black font-bold shadow-sm' 
                    : 'text-glass-muted hover:bg-white/5 hover:text-glass-text'
                }
            `}
        >
            <Icon className={`w-4 h-4 ${activeTab === id ? 'text-black' : 'text-glass-accent'}`} />
            {label}
        </button>
    );

    const allWallpapers = [...userWallpapers, ...WALLPAPERS];

    return (
        <div ref={containerRef} className={`flex h-full w-full bg-glass-base/20 text-glass-text overflow-hidden ${isMobile ? 'flex-col' : 'flex-row'}`}>
            
            {/* Sidebar */}
            <div className={`
                bg-glass-base/50 backdrop-blur-md p-4 flex shrink-0 border-glass-border
                ${isMobile ? 'w-full flex-col border-b gap-3' : 'w-56 border-r flex-col'}
            `}>
                <div className={`flex items-center gap-3 ${isMobile ? 'mb-1' : 'mb-8 px-2'}`}>
                    <div className="w-9 h-9 rounded-[8px] bg-glass-secondary flex items-center justify-center border border-glass-border shadow-inner shrink-0">
                        <Monitor className="w-5 h-5 text-glass-accent" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-glass-text leading-tight">Configurações</div>
                        <div className="text-[9px] text-glass-muted font-mono">System v3.0</div>
                    </div>
                </div>

                <nav className={`flex ${isMobile ? 'gap-2 overflow-x-auto no-scrollbar pb-1 w-full' : 'flex-col space-y-1 flex-1'}`}>
                    {renderSidebarItem('general', 'Geral', Info)}
                    {renderSidebarItem('appearance', 'Aparência', Palette)}
                    {renderSidebarItem('account', 'Conta', User)}
                    {renderSidebarItem('security', 'Segurança', Shield)}
                </nav>
            </div>

            {/* Content Area */}
            <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-5' : 'p-8'} relative custom-scrollbar`}>
                <h2 className={`font-light mb-8 flex items-center gap-3 text-glass-text ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                    {activeTab === 'appearance' && <Palette className="w-6 h-6 text-glass-accent" />}
                    {activeTab === 'general' && <Info className="w-6 h-6 text-glass-accent" />}
                    {activeTab === 'appearance' ? 'Personalização & Tema' : 'Informações do Sistema'}
                </h2>

                {activeTab === 'appearance' && (
                    <div className="animate-in fade-in duration-500 space-y-8 pb-20">
                        
                        {/* 1. Quick Themes (Temas Rápidos) */}
                        <section className="bg-glass-panel border border-glass-border rounded-xl p-5 shadow-sm relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-r from-glass-accent/5 to-transparent pointer-events-none" />
                             <h3 className="text-[10px] font-black text-glass-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-glass-accent" /> Temas Rápidos
                            </h3>
                            <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                                {PRESETS.map(preset => {
                                    const isSelected = theme.baseColor === preset.theme.baseColor && theme.accentColor === preset.theme.accentColor;
                                    return (
                                        <button 
                                            key={preset.id}
                                            onClick={() => setTheme(preset.theme)}
                                            className={`
                                                relative flex flex-col items-center justify-center gap-3 p-4 rounded-lg border transition-all duration-300 group
                                                ${isSelected 
                                                    ? 'bg-glass-accent/10 border-glass-accent ring-1 ring-glass-accent shadow-glass-hover' 
                                                    : 'bg-glass-base/50 border-glass-border hover:bg-white/5 hover:border-glass-accent/50'
                                                }
                                            `}
                                        >
                                            {isSelected && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-glass-accent rounded-full shadow-[0_0_8px_var(--glass-accent)]" />}
                                            <div className={`
                                                w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110
                                                ${isSelected ? 'bg-glass-accent text-black' : 'bg-glass-base border border-glass-border text-glass-text'}
                                            `}>
                                                <preset.icon className="w-5 h-5" />
                                            </div>
                                            <span className={`text-[11px] font-bold ${isSelected ? 'text-glass-accent' : 'text-glass-text'}`}>
                                                {preset.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* 2. Wallpaper Gallery (Carousel) */}
                        <section>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h3 className="text-[10px] font-black text-glass-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                    <ImageIcon className="w-3.5 h-3.5" /> Galeria de Fundos
                                </h3>
                                <div className="flex gap-2">
                                    <span className="text-[9px] text-glass-muted font-mono bg-glass-panel border border-glass-border px-1.5 py-0.5 rounded">
                                        {allWallpapers.length} ASSETS
                                    </span>
                                </div>
                            </div>
                            
                            {/* Horizontal Scroll / Carousel Container */}
                            <div className="w-full overflow-x-auto custom-scrollbar pb-4 snap-x flex gap-4 pr-4">
                                
                                {/* Upload Button */}
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="group relative w-32 aspect-video flex-shrink-0 rounded-lg border border-dashed border-glass-border hover:border-glass-accent hover:bg-glass-accent/5 transition-all duration-300 flex flex-col items-center justify-center gap-2 snap-start"
                                >
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleFileUpload} 
                                    />
                                    <div className="w-8 h-8 rounded-full bg-glass-panel border border-glass-border flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Plus className="w-4 h-4 text-glass-muted group-hover:text-glass-accent" />
                                    </div>
                                    <span className="text-[9px] font-bold uppercase text-glass-muted group-hover:text-glass-accent">Adicionar</span>
                                </button>

                                {/* Images */}
                                {allWallpapers.map((wp) => (
                                    <button 
                                        key={wp.id}
                                        onClick={() => setWallpaper(wp.url)}
                                        className={`
                                            group relative w-48 aspect-video flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-300 snap-center
                                            ${wallpaper === wp.url 
                                                ? 'border-glass-accent shadow-[0_0_15px_var(--glass-shadow-color)] scale-100 z-10' 
                                                : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105 hover:z-10'
                                            }
                                        `}
                                    >
                                        <LazyImage src={wp.url} alt={wp.name} className="w-full h-full" />
                                        
                                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[9px] font-bold text-white uppercase tracking-wider shadow-sm truncate block">{wp.name}</span>
                                        </div>
                                        
                                        {/* Active Indicator */}
                                        {wallpaper === wp.url && (
                                            <div className="absolute top-2 right-2 bg-glass-accent text-black p-0.5 rounded-full shadow-lg">
                                                <Check className="w-3 h-3" strokeWidth={4} />
                                            </div>
                                        )}

                                        {/* Delete Button (Only for user wallpapers) */}
                                        {(wp as UserWallpaper).isUser && (
                                            <div 
                                                onClick={(e) => handleDeleteWallpaper(wp.id, e)}
                                                className="absolute top-2 left-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white p-1.5 rounded-md backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100 border border-red-500/30"
                                                title="Remover Imagem"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 3. The Panels (Split View) */}
                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Left Panel: Tintura / Base */}
                            <div className="bg-glass-panel border border-glass-border rounded-xl p-0 shadow-liquid-border relative overflow-hidden group flex flex-col">
                                <div className="absolute inset-0 bg-gradient-to-br from-glass-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                
                                <div className="px-6 py-4 border-b border-glass-border/50 bg-white/5 flex items-center gap-2">
                                    <Droplets className="w-4 h-4 text-glass-accent" />
                                    <h4 className="text-xs font-black text-glass-text uppercase tracking-wider">
                                        Tintura da Janela (Base)
                                    </h4>
                                </div>
                                
                                <div className="p-6 space-y-8 relative z-10 flex-1">
                                    {/* Color Picker */}
                                    <div className="flex items-center justify-between group/item">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-bold text-glass-text">Cor do Vidro</span>
                                            <div className="text-[9px] font-mono text-glass-muted bg-glass-base px-1.5 py-0.5 rounded border border-glass-border w-fit">
                                                {theme.baseColor.toUpperCase()}
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <div 
                                                className="w-12 h-12 rounded-xl shadow-inner border border-white/20 z-10 relative overflow-hidden group-hover/item:scale-105 transition-transform"
                                                style={{ backgroundColor: theme.baseColor }}
                                            >
                                                 <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                                            </div>
                                            <input 
                                                type="color" 
                                                value={theme.baseColor || '#050508'}
                                                onChange={(e) => setTheme({ baseColor: e.target.value })}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Transparency Slider (Inverted Logic Fix) */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-3 font-medium items-end">
                                            <span className="text-glass-text font-bold">Densidade</span>
                                            <span className="font-mono text-glass-accent text-[10px] bg-glass-accent/10 px-1.5 rounded">{transparencyValue}%</span>
                                        </div>
                                        <div className="relative h-1.5 bg-glass-base rounded-full overflow-hidden shadow-inner border border-white/5">
                                            {/* Fill */}
                                            <div 
                                                className="absolute top-0 left-0 h-full bg-glass-accent transition-all duration-75" 
                                                style={{ width: `${transparencyValue}%` }}
                                            />
                                            {/* Input */}
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="95" 
                                                step="1"
                                                value={transparencyValue}
                                                onChange={(e) => handleTransparencyChange(parseInt(e.target.value))}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1.5">
                                            <span className="text-[8px] text-glass-muted uppercase">Sólido</span>
                                            <span className="text-[8px] text-glass-muted uppercase">Líquido</span>
                                        </div>
                                    </div>

                                    {/* Blur Slider */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-3 font-medium items-end">
                                            <span className="text-glass-text font-bold">Desfoque de Fundo</span>
                                            <span className="font-mono text-glass-accent text-[10px] bg-glass-accent/10 px-1.5 rounded">{theme.blurStrength}px</span>
                                        </div>
                                        <div className="relative h-1.5 bg-glass-base rounded-full overflow-hidden shadow-inner border border-white/5">
                                            <div 
                                                className="absolute top-0 left-0 h-full bg-glass-accent transition-all duration-75" 
                                                style={{ width: `${(theme.blurStrength / 50) * 100}%` }}
                                            />
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="50" 
                                                step="1"
                                                value={theme.blurStrength}
                                                onChange={(e) => setTheme({ blurStrength: parseInt(e.target.value) })}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel: Colors / Interface */}
                            <div className="bg-glass-panel border border-glass-border rounded-xl p-0 shadow-liquid-border relative overflow-hidden group flex flex-col">
                                <div className="absolute inset-0 bg-gradient-to-bl from-glass-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                <div className="px-6 py-4 border-b border-glass-border/50 bg-white/5 flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-glass-accent" />
                                    <h4 className="text-xs font-black text-glass-text uppercase tracking-wider">
                                        Cores de Interface
                                    </h4>
                                </div>

                                <div className="p-6 space-y-8 relative z-10 flex-1">
                                    {/* Accent Color */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-glass-text">Cor de Destaque</span>
                                            <span className="text-[9px] font-mono text-glass-muted bg-glass-base px-1.5 py-0.5 rounded border border-glass-border">{theme.accentColor.toUpperCase()}</span>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-3">
                                            {/* Presets */}
                                            {['#E2E8F0', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B'].map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setTheme({ accentColor: color })}
                                                    className={`
                                                        w-8 h-8 rounded-full border border-white/10 transition-all duration-200 hover:scale-110 shadow-lg
                                                        ${theme.accentColor.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'}
                                                    `}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                            {/* Custom Picker */}
                                            <label className="w-8 h-8 rounded-full border border-dashed border-glass-muted flex items-center justify-center cursor-pointer hover:bg-white/10 hover:border-white transition-colors relative">
                                                <div className="w-1.5 h-1.5 rounded-full bg-glass-muted" />
                                                <input 
                                                    type="color" 
                                                    value={theme.accentColor}
                                                    onChange={(e) => setTheme({ accentColor: e.target.value })}
                                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="h-px bg-glass-border/30" />

                                    {/* Text Color */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-bold text-glass-text">Cor do Texto Principal</span>
                                            <span className="text-[10px] text-glass-muted font-mono">{theme.textColor.toUpperCase()}</span>
                                        </div>
                                        <div className="relative group/picker">
                                            <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-glass-border bg-glass-base hover:border-glass-accent/50 transition-colors">
                                                <div 
                                                    className="w-4 h-4 rounded-full border border-white/10 shadow-sm"
                                                    style={{ backgroundColor: theme.textColor }}
                                                />
                                                <Type className="w-3 h-3 text-glass-muted" />
                                            </div>
                                            <input 
                                                type="color" 
                                                value={theme.textColor}
                                                onChange={(e) => setTheme({ textColor: e.target.value })}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="h-px bg-glass-border/30" />

                                    {/* High Contrast */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Contrast className="w-4 h-4 text-glass-text" />
                                            <span className="text-sm font-bold text-glass-text">Alto Contraste</span>
                                        </div>
                                        <button 
                                            onClick={() => setTheme({ highContrast: !theme.highContrast })}
                                            className={`
                                                w-10 h-6 rounded-full relative transition-colors duration-300 ease-in-out border border-white/10
                                                ${theme.highContrast ? 'bg-glass-accent' : 'bg-glass-base'}
                                            `}
                                        >
                                            <div className={`
                                                absolute top-1 left-1 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-300 
                                                ${theme.highContrast ? 'translate-x-4' : ''}
                                            `} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'general' && (
                     <div className="animate-in fade-in duration-300">
                        <div className="flex flex-col items-center justify-center p-12 bg-glass-panel border border-glass-border rounded-xl mb-6 shadow-liquid-border">
                            <div className="w-24 h-24 rounded-[20px] bg-glass-base flex items-center justify-center shadow-2xl mb-6 relative overflow-hidden border border-glass-border">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                                <Monitor className="w-12 h-12 text-glass-accent relative z-10" />
                            </div>
                            <h1 className="text-3xl font-light text-glass-text mb-2 tracking-tight">Rabelus WebOS</h1>
                            <p className="text-sm font-mono text-glass-muted uppercase tracking-widest">Versão 3.0.0 (Obsidian Kernel)</p>
                        </div>

                        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                             <div className="p-5 bg-glass-panel border border-glass-border rounded-xl flex items-center justify-between group hover:border-glass-accent/30 transition-colors">
                                <div>
                                    <div className="text-[10px] text-glass-muted font-bold uppercase tracking-wider mb-1">Status do Sistema</div>
                                    <div className="flex items-center gap-2 text-glass-profit font-mono text-sm font-bold">
                                        <div className="w-2 h-2 rounded-full bg-glass-profit animate-pulse shadow-[0_0_8px_var(--glass-profit)]"></div>
                                        ONLINE
                                    </div>
                                </div>
                                <Shield className="w-8 h-8 text-glass-muted/20 group-hover:text-glass-profit/20 transition-colors" />
                             </div>
                             
                             <div className="p-5 bg-glass-panel border border-glass-border rounded-xl flex items-center justify-between group hover:border-glass-accent/30 transition-colors">
                                <div>
                                    <div className="text-[10px] text-glass-muted font-bold uppercase tracking-wider mb-1">Resolução</div>
                                    <div className="text-glass-text font-mono text-sm font-bold">{window.innerWidth} x {window.innerHeight}</div>
                                </div>
                                <Grid className="w-8 h-8 text-glass-muted/20 group-hover:text-glass-accent/20 transition-colors" />
                             </div>

                             <div className="p-5 bg-glass-panel border border-glass-border rounded-xl flex items-center justify-between group hover:border-glass-accent/30 transition-colors">
                                <div>
                                    <div className="text-[10px] text-glass-muted font-bold uppercase tracking-wider mb-1">Input</div>
                                    <div className="text-glass-text font-mono text-sm font-bold">Pointer / Touch</div>
                                </div>
                                <MousePointer2 className="w-8 h-8 text-glass-muted/20 group-hover:text-glass-accent/20 transition-colors" />
                             </div>
                        </div>
                     </div>
                )}
            </div>
        </div>
    );
};