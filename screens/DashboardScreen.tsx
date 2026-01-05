
import React, { useEffect, useState } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import { useGamification } from '../context/GamificationContext';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  CheckCircle2, 
  Circle, 
  CandlestickChart, 
  Newspaper, 
  Settings, 
  Crown,
  Coins,
  ArrowRight
} from 'lucide-react';

// --- Components ---

const QuickAction = ({ icon: Icon, label, onClick, colorClass }: any) => (
  <button 
    onClick={onClick}
    className="group relative flex flex-col items-center justify-center p-5 bg-glass-panel border border-glass-border shadow-sm transition-all duration-300 hover:bg-glass-panel/80 hover:-translate-y-1 overflow-hidden rounded-tahoe hover:shadow-glass-hover"
  >
    {/* Gradient background on hover/active */}
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${colorClass}`}></div>
    
    <div className="p-3 bg-glass-accent/5 rounded-[8px] mb-2 shadow-inner border border-glass-accent/10 group-hover:scale-110 transition-transform relative z-10">
      <Icon className="w-6 h-6 text-glass-accent" />
    </div>
    <span className="text-[10px] font-bold uppercase tracking-widest text-glass-text relative z-10">{label}</span>
  </button>
);

const MarketCard = ({ symbol, name, price, change }: any) => {
    const isPositive = change >= 0;
    return (
        <div className="flex items-center justify-between p-3 border-b border-glass-border/50 last:border-0 hover:bg-white/5 transition-colors cursor-default group">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[6px] bg-glass-secondary/50 flex items-center justify-center text-[10px] font-bold border border-glass-border/30 shadow-sm text-glass-text">
                    {symbol}
                </div>
                <div>
                    <div className="text-xs font-bold text-glass-text">{name}</div>
                    <div className="text-[9px] text-glass-muted font-mono">USD</div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-sm font-bold font-mono text-glass-text group-hover:text-glass-accent transition-colors">
                    ${price.toLocaleString()}
                </div>
                <div className={`text-[9px] font-bold flex items-center justify-end gap-1 ${isPositive ? 'text-glass-profit' : 'text-glass-loss'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(change).toFixed(2)}%
                </div>
            </div>
        </div>
    );
};

const QuestItem = ({ id, label, xp, completed, onClick }: any) => (
    <div 
        onClick={() => !completed && onClick()}
        className={`
            flex items-center justify-between p-3 rounded-[8px] border border-glass-border transition-all duration-300
            ${completed 
                ? 'bg-glass-profit/5 border-glass-profit/20 opacity-50' 
                : 'bg-glass-base/30 hover:bg-glass-base/50 cursor-pointer hover:border-glass-accent hover:shadow-lg'
            }
        `}
    >
        <div className="flex items-center gap-3">
            {completed ? (
                <CheckCircle2 className="w-4 h-4 text-glass-profit" />
            ) : (
                <Circle className="w-4 h-4 text-glass-muted" />
            )}
            <span className={`text-xs font-medium ${completed ? 'line-through text-glass-muted' : 'text-glass-text'}`}>
                {label}
            </span>
        </div>
        <div className="flex items-center gap-1 bg-glass-base/50 px-2 py-0.5 rounded-[4px] border border-glass-border/50">
            <Zap className="w-2.5 h-2.5 text-glass-accent fill-current" />
            <span className="text-[9px] font-bold text-glass-text">{xp}</span>
        </div>
    </div>
);

// --- Main Dashboard ---

export const DashboardScreen: React.FC = () => {
  const { openApp } = useWindowManager();
  const { xp, level, coins, rankTitle, rankIcon, progressPercent, completeQuest, completedQuests, username } = useGamification();
  const [marketData, setMarketData] = useState<any[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(true);

  // Daily Quests Definition
  const quests = [
      { id: 'daily_news', label: 'Ler 3 Notícias', xp: 50 },
      { id: 'daily_live', label: 'Assistir Live', xp: 100 },
      { id: 'daily_check', label: 'Verificar Ticker', xp: 20 },
  ];

  useEffect(() => {
    // Simple mock-ish fetch to CoinGecko free API
    const fetchMarket = async () => {
        try {
            const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple&vs_currencies=usd&include_24hr_change=true');
            const data = await res.json();
            const format = [
                { symbol: 'BTC', name: 'Bitcoin', price: data.bitcoin.usd, change: data.bitcoin.usd_24h_change },
                { symbol: 'ETH', name: 'Ethereum', price: data.ethereum.usd, change: data.ethereum.usd_24h_change },
                { symbol: 'SOL', name: 'Solana', price: data.solana.usd, change: data.solana.usd_24h_change },
            ];
            setMarketData(format);
        } catch (e) {
            // Fallback mock if API fails (rate limit)
            setMarketData([
                { symbol: 'BTC', name: 'Bitcoin', price: 64230.50, change: 2.4 },
                { symbol: 'ETH', name: 'Ethereum', price: 3450.10, change: -1.2 },
                { symbol: 'SOL', name: 'Solana', price: 145.20, change: 5.7 },
            ]);
        } finally {
            setLoadingMarket(false);
        }
    };
    fetchMarket();
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto p-6 md:p-8 relative custom-scrollbar">
        {/* Subtle Background Glow - Updated Colors */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-glass-accent/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#2563EB]/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

        <div className="max-w-[1200px] mx-auto flex flex-col gap-6 relative z-10">
            
            {/* --- HEADER SECTION --- */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-glass-border/30">
                <div className="flex items-center gap-5 w-full md:w-auto">
                    <div className="relative group cursor-default">
                        <div className="w-16 h-16 rounded-tahoe bg-gradient-to-br from-glass-secondary to-black border border-glass-border flex items-center justify-center text-3xl shadow-glass transition-transform group-hover:scale-105">
                            {rankIcon}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-glass-base border border-glass-border text-glass-accent text-[9px] font-black uppercase px-1.5 py-0.5 rounded-[4px] shadow-lg">
                            L{level}
                        </div>
                    </div>
                    
                    <div className="flex-1">
                        <h1 className="text-2xl font-light text-glass-text tracking-tight">
                            Olá, <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-glass-text to-glass-accent">{username}</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Crown className="w-3.5 h-3.5 text-glass-accent fill-current" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-glass-muted">{rankTitle}</span>
                        </div>
                    </div>
                </div>

                {/* XP & Coins Stats - Glass Tile */}
                <div className="flex items-center gap-6 bg-glass-panel px-5 py-3 rounded-tahoe border border-glass-border shadow-sm w-full md:w-auto backdrop-blur-md">
                    <div className="flex flex-col w-full md:w-32">
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider mb-1 text-glass-muted">
                            <span>Progresso</span>
                            <span>{Math.floor(progressPercent)}%</span>
                        </div>
                        <div className="w-full h-1 bg-glass-base rounded-full overflow-hidden border border-white/5">
                            <div 
                                className="h-full bg-glass-accent shadow-[0_0_10px_currentColor] transition-all duration-1000"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="w-px h-6 bg-glass-border hidden md:block"></div>

                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-glass-accent/10 rounded-[6px] border border-glass-accent/20">
                            <Coins className="w-4 h-4 text-glass-accent" />
                        </div>
                        <div>
                            <div className="text-lg font-bold font-mono text-glass-text leading-none">{coins}</div>
                            <div className="text-[9px] uppercase tracking-widest text-glass-muted">Coins</div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* --- LEFT COLUMN (8 cols) --- */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    
                    {/* Shortcuts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <QuickAction 
                            icon={CandlestickChart} 
                            label="Terminal Trade" 
                            onClick={() => openApp('trading')} 
                            colorClass="from-blue-500/20 to-cyan-500/20"
                        />
                        <QuickAction 
                            icon={Newspaper} 
                            label="Notícias" 
                            onClick={() => openApp('news')} 
                            colorClass="from-orange-500/20 to-amber-500/20"
                        />
                        <QuickAction 
                            icon={Settings} 
                            label="Ajustes" 
                            onClick={() => openApp('settings')} 
                            colorClass="from-gray-500/20 to-slate-500/20"
                        />
                    </div>

                    {/* Daily Quests - Tahoe Card */}
                    <div className="flex-1 bg-glass-panel border border-glass-border rounded-tahoe p-5 relative overflow-hidden flex flex-col backdrop-blur-md shadow-liquid-border">
                        <div className="flex justify-between items-center mb-4 relative z-10">
                            <h3 className="text-glass-text font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-glass-accent" />
                                Protocolo Diário
                            </h3>
                            <div className="text-[9px] font-mono text-glass-muted bg-glass-base/50 px-2 py-1 rounded-[4px] border border-glass-border">
                                Reset: 12h
                            </div>
                        </div>

                        <div className="space-y-2 relative z-10">
                            {quests.map(q => (
                                <QuestItem 
                                    key={q.id}
                                    {...q}
                                    completed={completedQuests.includes(q.id)}
                                    onClick={() => completeQuest(q.id, q.xp)}
                                />
                            ))}
                        </div>
                        
                        {completedQuests.length === quests.length && (
                            <div className="mt-auto pt-4 relative z-10">
                                <div className="p-3 bg-glass-profit/10 border border-glass-profit/30 rounded-[6px] flex items-center justify-center gap-2 animate-pulse">
                                    <Trophy className="w-4 h-4 text-glass-profit" />
                                    <span className="text-[10px] font-bold text-glass-profit uppercase tracking-widest">Objetivos Concluídos</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- RIGHT COLUMN (4 cols) --- */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    
                    {/* Market Ticker - Tahoe Card */}
                    <div className="bg-glass-panel border border-glass-border rounded-tahoe overflow-hidden flex flex-col backdrop-blur-md shadow-liquid-border">
                        <div className="p-3 border-b border-glass-border bg-glass-base/30 flex justify-between items-center">
                            <h3 className="text-glass-text font-bold text-[10px] uppercase tracking-widest">Mercado</h3>
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-glass-profit rounded-full animate-pulse shadow-[0_0_5px_currentColor]"></div>
                            </div>
                        </div>
                        
                        <div className="flex-1">
                            {loadingMarket ? (
                                <div className="p-8 text-center text-xs font-mono text-glass-muted animate-pulse">
                                    Oracle Sync...
                                </div>
                            ) : (
                                marketData.map((coin, idx) => (
                                    <MarketCard key={idx} {...coin} />
                                ))
                            )}
                        </div>
                        
                        <button 
                            onClick={() => openApp('trading')}
                            className="p-2.5 text-[9px] font-bold uppercase tracking-widest text-glass-muted hover:text-glass-accent hover:bg-white/5 transition-colors border-t border-glass-border flex items-center justify-center gap-2"
                        >
                            Ver Terminal <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Banner */}
                    <div className="bg-gradient-to-br from-glass-secondary to-black border border-glass-border rounded-tahoe p-5 relative overflow-hidden group cursor-pointer hover:border-glass-accent/50 transition-colors shadow-glass">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-glass-accent rounded-full blur-[60px] opacity-10 group-hover:opacity-30 transition-opacity"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-[6px] bg-glass-accent flex items-center justify-center text-black shadow-lg">
                                    <Crown className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[9px] font-bold text-glass-accent uppercase tracking-[0.2em]">Mentoria</span>
                            </div>
                            <h4 className="text-sm font-medium text-white mb-4 leading-tight opacity-90">
                                Domine a psicologia do mercado.
                            </h4>
                            <button className="w-full py-2 border border-glass-accent/30 text-glass-accent text-[10px] font-bold uppercase hover:bg-glass-accent hover:text-black transition-all rounded-[6px]">
                                Acessar
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
  );
};
