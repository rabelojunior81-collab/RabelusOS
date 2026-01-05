
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../context/AppStoreContext';
import { useWindowManager } from '../context/WindowManagerContext';
import { SYSTEM_APP_IDS, STORE_CATALOG } from '../utils/constants';
import { 
    ShoppingBag, Search, Check, Download, Loader2, 
    Star, ArrowLeft, ShieldCheck, Zap, Share2, 
    MoreVertical, Flag, LayoutGrid, Cpu, Box, GraduationCap, Play
} from 'lucide-react';
import { AppId, StoreItem } from '../types';

// --- COMPONENTS ---

// 1. Star Rating (Visual)
const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
            <Star 
                key={s} 
                className={`w-2.5 h-2.5 ${s <= rating ? 'text-glass-accent fill-current' : 'text-glass-muted'}`} 
            />
        ))}
        <span className="text-[10px] text-glass-muted ml-1 font-mono">{rating.toFixed(1)}</span>
    </div>
);

// 2. App Card (Vertical - Play Store Style)
const AppCard = ({ item, onClick, isInstalled }: { item: StoreItem, onClick: () => void, isInstalled: boolean }) => {
    const Icon = item.icon;
    return (
        <button 
            onClick={onClick}
            className="group flex flex-col items-start text-left w-[120px] shrink-0 snap-start"
        >
            <div className="relative w-[120px] h-[120px] mb-3 rounded-2xl overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105 group-active:scale-95 border border-white/5 bg-glass-panel">
                <div className={`absolute inset-0 bg-gradient-to-br from-glass-secondary to-glass-base opacity-50`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className={`w-12 h-12 ${isInstalled ? 'text-glass-profit' : 'text-glass-accent'} drop-shadow-md`} />
                </div>
                {/* Installed Badge */}
                {isInstalled && (
                    <div className="absolute top-2 right-2 bg-glass-profit/20 p-1 rounded-full border border-glass-profit/30">
                        <Check className="w-3 h-3 text-glass-profit" strokeWidth={3} />
                    </div>
                )}
            </div>
            
            <h3 className="text-xs font-bold text-glass-text leading-tight line-clamp-2 mb-1 group-hover:text-white">{item.label}</h3>
            <span className="text-[10px] text-glass-muted block mb-1">{item.category === 'lab' ? 'Rabelus Lab' : 'Utilitários'}</span>
            <div className="flex items-center gap-2">
                <span className="text-[9px] text-glass-muted font-mono">{item.rating || '4.5'} ★</span>
            </div>
        </button>
    );
};

// 3. Hero Banner (Carousel)
const HeroBanner = ({ item, onClick }: { item: StoreItem, onClick: () => void }) => (
    <div 
        onClick={onClick}
        className="relative w-full h-[280px] rounded-2xl overflow-hidden cursor-pointer group shrink-0 border border-glass-border shadow-2xl"
    >
        <div className="absolute inset-0 bg-glass-secondary"></div>
        {/* Abstract Background based on Icon Color would be cool, using static gradient for now */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2864&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay transition-transform duration-1000 group-hover:scale-110"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#000] via-[#000]/40 to-transparent p-6 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-3">
                 <span className="px-2 py-0.5 bg-glass-accent text-black text-[9px] font-black uppercase tracking-widest rounded-[4px] shadow-lg">Destaque</span>
            </div>
            <h2 className="font-bold text-white mb-2 text-3xl tracking-tight shadow-sm">{item.label}</h2>
            <p className="text-glass-muted max-w-lg text-sm mb-4 leading-relaxed line-clamp-2 font-medium">
                {item.description}
            </p>
            <div className="flex items-center gap-4">
                <button className="px-6 py-2 bg-white text-black font-bold text-xs uppercase tracking-wide rounded-lg hover:bg-glass-accent transition-colors shadow-lg">
                    Ver Detalhes
                </button>
            </div>
        </div>
    </div>
);

// 4. Horizontal Section
const Section = ({ title, items, onAppClick, isInstalled }: { title: string, items: StoreItem[], onAppClick: (i: StoreItem) => void, isInstalled: (id: AppId) => boolean }) => (
    <div className="mb-8">
        <div className="flex items-center justify-between px-6 mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                {title} <ArrowLeft className="w-3 h-3 rotate-180 text-glass-muted" />
            </h2>
        </div>
        <div className="flex overflow-x-auto gap-4 px-6 pb-4 snap-x custom-scrollbar">
            {items.map(item => (
                <AppCard 
                    key={item.id} 
                    item={item} 
                    onClick={() => onAppClick(item)} 
                    isInstalled={isInstalled(item.id as AppId)} 
                />
            ))}
        </div>
    </div>
);

// 5. App Details Page
const AppDetails = ({ item, onClose, onAction, processing, isInstalled }: { item: StoreItem, onClose: () => void, onAction: () => void, processing: boolean, isInstalled: boolean }) => {
    const Icon = item.icon;
    
    return (
        <div className="absolute inset-0 bg-[#050508] z-50 overflow-y-auto animate-in slide-in-from-bottom-4 duration-300 custom-scrollbar">
            {/* Header / Nav */}
            <div className="sticky top-0 z-50 flex items-center justify-between p-4 bg-[#050508]/80 backdrop-blur-md border-b border-white/5">
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-full text-glass-muted hover:text-white"><Search className="w-5 h-5" /></button>
                    <button className="p-2 hover:bg-white/10 rounded-full text-glass-muted hover:text-white"><MoreVertical className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto pb-24">
                {/* Hero Info */}
                <div className="px-6 pt-4 pb-8 flex gap-6 items-start">
                    <div className="w-24 h-24 rounded-2xl bg-glass-secondary border border-glass-border shadow-2xl flex items-center justify-center shrink-0">
                        <Icon className={`w-10 h-10 ${isInstalled ? 'text-glass-profit' : 'text-glass-accent'}`} />
                    </div>
                    <div className="flex-1 pt-1">
                        <h1 className="text-2xl font-bold text-white mb-1">{item.label}</h1>
                        <p className="text-glass-accent text-xs font-bold uppercase tracking-wide mb-3">Rabelus Laboratory</p>
                        
                        <div className="flex items-center gap-4 text-xs text-glass-muted">
                            <div className="flex flex-col items-center border-r border-white/10 pr-4">
                                <span className="font-bold text-white flex gap-1 items-center">{item.rating || '4.5'} <Star className="w-3 h-3 fill-current" /></span>
                                <span className="text-[9px]">avaliações</span>
                            </div>
                            <div className="flex flex-col items-center border-r border-white/10 pr-4">
                                <span className="font-bold text-white">{item.downloads || '1k+'}</span>
                                <span className="text-[9px]">downloads</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="w-6 h-6 flex items-center justify-center bg-white/10 rounded text-[9px] font-bold">L</span>
                                <span className="text-[9px]">Livre</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Action Bar for Mobile/Desktop */}
                <div className="px-6 mb-8">
                    <button 
                        onClick={onAction}
                        disabled={processing}
                        className={`
                            w-full py-3 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg
                            ${isInstalled 
                                ? 'bg-white/10 text-glass-accent hover:bg-white/20 border border-glass-accent/30' 
                                : 'bg-glass-accent text-black hover:bg-white hover:scale-[1.01]'
                            }
                            ${processing ? 'opacity-80 cursor-wait' : ''}
                        `}
                    >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : isInstalled ? 'Abrir Aplicativo' : 'Instalar'}
                    </button>
                    {isInstalled && !SYSTEM_APP_IDS.includes(item.id as AppId) && (
                         <div className="text-center mt-3">
                             <button className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider">Desinstalar</button>
                         </div>
                    )}
                </div>

                {/* Screenshots Carousel */}
                <div className="mb-8">
                     <h3 className="px-6 text-sm font-bold text-white mb-4">Prévia</h3>
                     <div className="flex overflow-x-auto gap-3 px-6 pb-4 snap-x custom-scrollbar">
                        {(item.screenshots || ['#1e293b', '#0f172a', '#020617']).map((color, i) => (
                            <div key={i} className="w-[200px] h-[350px] shrink-0 rounded-xl bg-glass-panel border border-glass-border overflow-hidden relative snap-center" style={{backgroundColor: color}}>
                                {/* Mock UI */}
                                <div className="absolute top-4 left-4 right-4 h-4 bg-white/10 rounded-full"></div>
                                <div className="absolute top-12 left-4 w-12 h-12 bg-white/10 rounded-full"></div>
                                <div className="absolute top-12 left-20 right-4 h-12 bg-white/5 rounded-lg"></div>
                                <div className="absolute top-32 left-4 right-4 bottom-4 bg-white/5 rounded-lg border border-white/5"></div>
                            </div>
                        ))}
                     </div>
                </div>

                {/* Description */}
                <div className="px-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white">Sobre este app</h3>
                        <ArrowLeft className="w-4 h-4 text-glass-muted rotate-180" />
                    </div>
                    <p className="text-sm text-glass-text/80 leading-relaxed font-sans">
                        {item.description}
                        <br/><br/>
                        Desenvolvido sob a filosofia "Thick Client Architecture" do Rabelus Lab, este módulo opera com processamento local para garantir privacidade absoluta e performance de borda. Integração nativa com o Gemini Neural Engine para assistência cognitiva em tempo real.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-glass-muted font-mono">v3.0.0</span>
                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-glass-muted font-mono">Obsidian UI</span>
                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-glass-muted font-mono">Local Storage</span>
                    </div>
                </div>

                 {/* Security Badge */}
                 <div className="px-6 mb-8">
                    <div className="p-4 rounded-xl border border-glass-border bg-glass-base/50 flex items-center gap-4">
                        <ShieldCheck className="w-8 h-8 text-glass-profit" />
                        <div>
                            <h4 className="text-xs font-bold text-white">Verificado pelo Rabelus Core</h4>
                            <p className="text-[10px] text-glass-muted mt-0.5">Nenhum tracker externo ou código malicioso detectado.</p>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    );
};

// --- MAIN STORE COMPONENT ---

export const StoreApp: React.FC = () => {
    const { isInstalled, installApp, uninstallApp } = useAppStore();
    const { openApp, closeApp } = useWindowManager();
    
    // UI State
    const [view, setView] = useState<'home' | 'details'>('home');
    const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'lab' | 'app' | 'ai'>('all');
    
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Filter Logic
    const getFilteredItems = (cat?: string) => {
        if (!cat || cat === 'all') return STORE_CATALOG;
        return STORE_CATALOG.filter(i => i.category === cat);
    };

    // --- ACTIONS ---

    const handleAppClick = (item: StoreItem) => {
        setSelectedItem(item);
        setView('details');
    };

    const handleAction = async () => {
        if (!selectedItem) return;
        const item = selectedItem;

        // Web Link Logic
        if (item.isWebLink && item.url) {
            window.open(item.url, '_blank');
            return;
        }

        const installed = isInstalled(item.id as AppId);

        if (installed) {
            openApp(item.id as AppId);
            return;
        }

        // Install Flow
        setProcessingId(item.id);
        await new Promise(r => setTimeout(r, 1500)); // Fake loading
        installApp(item.id as AppId);
        setProcessingId(null);
    };

    // --- RENDER ---

    return (
        <div className="flex flex-col h-full w-full bg-[#050508] text-glass-text relative font-sans selection:bg-glass-accent selection:text-black">
            
            {/* VIEW: DETAILS */}
            {view === 'details' && selectedItem && (
                <AppDetails 
                    item={selectedItem} 
                    onClose={() => setView('home')} 
                    onAction={handleAction}
                    processing={processingId === selectedItem.id}
                    isInstalled={isInstalled(selectedItem.id as AppId)}
                />
            )}

            {/* VIEW: HOME */}
            <div className={`flex flex-col h-full ${view === 'home' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                
                {/* 1. Top Search Bar (Fixed) */}
                <div className="h-16 flex items-center gap-4 px-6 border-b border-glass-border bg-[#050508]/90 backdrop-blur-xl z-20 shrink-0">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-glass-muted group-focus-within:text-glass-accent transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Pesquisar apps e jogos" 
                            className="w-full bg-glass-panel border border-glass-border rounded-full py-2.5 pl-10 pr-4 text-sm font-medium focus:bg-glass-panel/80 focus:ring-1 focus:ring-glass-accent outline-none transition-all placeholder:text-glass-muted/60 shadow-inner"
                        />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-glass-secondary to-glass-base border border-glass-border flex items-center justify-center text-glass-accent shadow-lg shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                    </div>
                </div>

                {/* 2. Navigation Tabs (Fixed below search) */}
                <div className="flex items-center gap-6 px-6 border-b border-glass-border bg-[#050508]/80 backdrop-blur-md z-10 shrink-0 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', label: 'Para você' },
                        { id: 'lab', label: 'Rabelus Lab' },
                        { id: 'app', label: 'Apps' },
                        { id: 'ai', label: 'Premium' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-glass-accent text-glass-accent' : 'border-transparent text-glass-muted hover:text-white'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 3. Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-[#050508] to-[#000]">
                    
                    {/* Featured Hero (Visible mostly on 'all' or 'lab') */}
                    {(activeTab === 'all' || activeTab === 'lab') && (
                        <div className="p-6">
                            <HeroBanner 
                                item={STORE_CATALOG.find(i => i.id === 'tubemaster_ai') || STORE_CATALOG[0]} 
                                onClick={() => handleAppClick(STORE_CATALOG.find(i => i.id === 'tubemaster_ai') || STORE_CATALOG[0])} 
                            />
                        </div>
                    )}

                    {/* Dynamic Sections based on Tab */}
                    {activeTab === 'all' && (
                        <>
                            <Section 
                                title="Rabelus Laboratory" 
                                items={getFilteredItems('lab')} 
                                onAppClick={handleAppClick} 
                                isInstalled={isInstalled} 
                            />
                            <Section 
                                title="Inteligência Artificial" 
                                items={getFilteredItems('ai')} 
                                onAppClick={handleAppClick} 
                                isInstalled={isInstalled} 
                            />
                             <Section 
                                title="Ferramentas Essenciais" 
                                items={getFilteredItems('app')} 
                                onAppClick={handleAppClick} 
                                isInstalled={isInstalled} 
                            />
                        </>
                    )}

                    {activeTab !== 'all' && (
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 p-6">
                            {getFilteredItems(activeTab === 'ai' || activeTab === 'lab' || activeTab === 'app' ? activeTab : undefined).map(item => (
                                <AppCard 
                                    key={item.id} 
                                    item={item} 
                                    onClick={() => handleAppClick(item)} 
                                    isInstalled={isInstalled(item.id as AppId)} 
                                />
                            ))}
                         </div>
                    )}
                    
                    <div className="h-20"></div> {/* Spacer */}
                </div>
            </div>
        </div>
    );
};
