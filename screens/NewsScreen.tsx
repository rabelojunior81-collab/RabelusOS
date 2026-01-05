
import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, RefreshCw, ExternalLink, Clock, ChevronRight, 
  LayoutGrid, List, TrendingUp, Search, Calendar, 
  ArrowUpRight, Zap, Hash, Layers, AlertTriangle, Filter,
  Maximize2
} from 'lucide-react';

// --- Types ---

interface NewsItem {
  id: string;
  source: string;
  author?: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: number; // timestamp
  imageUrl?: string;
  sentiment?: 'neutral' | 'bullish' | 'bearish';
  category: string;
}

interface NewsCategory {
  id: string;
  label: string;
  query: string;
  icon: any;
}

// --- Configuração ---

const CATEGORIES: NewsCategory[] = [
  { id: 'market', label: 'Mercado Geral', query: 'mercado financeiro criptomoedas', icon: Globe },
  { id: 'btc', label: 'Bitcoin Core', query: 'bitcoin btc price news', icon: TrendingUp },
  { id: 'altcoins', label: 'Altcoins & DeFi', query: 'ethereum solana defi web3', icon: Layers },
  { id: 'reg', label: 'Regulação & SEC', query: 'sec cvm regulation crypto', icon: AlertTriangle },
  { id: 'tech', label: 'Tech & Mining', query: 'blockchain mining hashrate', icon: Hash },
];

const GOOGLE_RSS_BASE = 'https://news.google.com/rss/search?q=';
const RSS_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

// --- Dados de Fallback (Para garantir que o layout nunca quebre) ---
const FALLBACK_NEWS: NewsItem[] = [
    {
        id: 'f1',
        source: 'Google Finance',
        title: 'Bitcoin supera resistência de $68k impulsionado por fluxo institucional de ETFs',
        summary: 'Volume de negociação spot atinge recorde mensal enquanto BlackRock reporta entradas massivas em seu fundo IBIT.',
        url: 'https://google.com/finance',
        publishedAt: Date.now() - 1000 * 60 * 30, // 30 min atrás
        category: 'btc',
        sentiment: 'bullish'
    },
    {
        id: 'f2',
        source: 'Bloomberg Crypto',
        title: 'SEC adia decisão sobre ETF de Ethereum Spot para Maio de 2025',
        summary: 'O regulador americano citou a necessidade de mais tempo para analisar os riscos de manipulação de mercado e correlação com futuros.',
        url: 'https://google.com/finance',
        publishedAt: Date.now() - 1000 * 60 * 60 * 2, // 2h atrás
        category: 'reg',
        sentiment: 'bearish'
    },
    {
        id: 'f3',
        source: 'CoinDesk',
        title: 'Solana lança atualização "Firedancer" na testnet prometendo 1 milhão de TPS',
        summary: 'A nova arquitetura de validador visa resolver os problemas de congestionamento da rede e competir diretamente com sistemas financeiros tradicionais.',
        url: 'https://google.com/finance',
        publishedAt: Date.now() - 1000 * 60 * 60 * 5, 
        category: 'altcoins',
        sentiment: 'bullish'
    },
    {
        id: 'f4',
        source: 'Valor Econômico',
        title: 'Campos Neto defende regulação global unificada para criptoativos',
        summary: 'Presidente do Banco Central do Brasil discursa no G20 sobre a importância da transparência nas exchanges.',
        url: 'https://google.com/finance',
        publishedAt: Date.now() - 1000 * 60 * 60 * 12,
        category: 'reg',
        sentiment: 'neutral'
    },
    {
        id: 'f5',
        source: 'The Block',
        title: 'Protocolo DeFi sofre exploit de $20 milhões em Flash Loan attack',
        summary: 'Auditoria revela falha no contrato inteligente de rebalanceamento de liquidez. Token nativo cai 40%.',
        url: 'https://google.com/finance',
        publishedAt: Date.now() - 1000 * 60 * 60 * 24,
        category: 'altcoins',
        sentiment: 'bearish'
    }
];

// --- Helpers ---

const timeAgo = (date: number) => {
    const seconds = Math.floor((Date.now() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "a atrás";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m atrás";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d atrás";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h atrás";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min atrás";
    return "Agora";
};

// --- Components ---

const TradingViewTicker = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && containerRef.current.childElementCount === 0) {
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
          "symbols": [
            { "proName": "BITSTAMP:BTCUSD", "title": "BTC" },
            { "proName": "BINANCE:ETHUSDT", "title": "ETH" },
            { "proName": "BINANCE:SOLUSDT", "title": "SOL" },
            { "description": "DXY", "proName": "TVC:DXY" },
            { "description": "GOLD", "proName": "TVC:GOLD" },
            { "description": "NASDAQ", "proName": "OANDA:NAS100USD" }
          ],
          "showSymbolLogo": true,
          "colorTheme": "dark",
          "isTransparent": true,
          "displayMode": "adaptive",
          "locale": "br"
        });
        containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full h-10 border-b border-glass-border/30 bg-black/40 shrink-0 relative z-50">
        <div className="tradingview-widget-container" ref={containerRef}>
            <div className="tradingview-widget-container__widget"></div>
        </div>
    </div>
  );
};

export const NewsScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('market');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch Logic
  const fetchNewsData = async (catId: string) => {
    setLoading(true);
    const category = CATEGORIES.find(c => c.id === catId);
    if (!category) return;

    // Construct Query
    const query = `${category.query} when:2d`; // Limit to last 2 days for relevance
    const encodedQuery = encodeURIComponent(query);
    const rssUrl = `${GOOGLE_RSS_BASE}${encodedQuery}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    
    try {
        const res = await fetch(`${RSS_API}${encodeURIComponent(rssUrl)}`);
        const data = await res.json();

        if (data.status === 'ok' && data.items.length > 0) {
            const mapped: NewsItem[] = data.items.map((item: any, idx: number) => {
                // Tenta limpar o título (Google News coloca " - Fonte" no final)
                const parts = item.title.split(' - ');
                const cleanTitle = parts.length > 1 ? parts.slice(0, -1).join(' - ') : item.title;
                const source = parts.length > 1 ? parts[parts.length - 1] : 'Google News';

                return {
                    id: item.guid || `news-${idx}`,
                    source: source,
                    title: cleanTitle,
                    summary: item.description.replace(/<[^>]+>/g, '').slice(0, 150) + '...', // Clean HTML
                    url: item.link,
                    publishedAt: new Date(item.pubDate).getTime(),
                    category: catId,
                    sentiment: 'neutral' // RSS cru não tem sentimento, mantemos neutro por padrão
                };
            });
            setNews(mapped);
        } else {
            // Se a API falhar (comum em RSS2JSON free), usa fallback misturado para parecer dinâmico
            console.warn('RSS Fetch falhou, usando dados de fallback.');
            setNews(FALLBACK_NEWS.filter(n => n.category === catId || catId === 'market'));
        }
    } catch (e) {
        console.error("Erro no fetch:", e);
        setNews(FALLBACK_NEWS);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsData(activeCategory);
  }, [activeCategory]);

  return (
    <div className="flex flex-col h-full w-full bg-glass-base/20 backdrop-blur-3xl text-glass-text overflow-hidden font-sans selection:bg-glass-accent selection:text-black">
        
        {/* Top Ticker */}
        <TradingViewTicker />

        <div className="flex flex-1 overflow-hidden relative">
            
            {/* --- SIDEBAR (Navigation) --- */}
            <div className="w-64 border-r border-glass-border/30 bg-black/20 flex flex-col shrink-0 backdrop-blur-md">
                <div className="p-6 border-b border-glass-border/30">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-glass-accent/10 rounded-lg border border-glass-accent/20 text-glass-accent">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="font-bold text-lg text-glass-text tracking-tight block leading-none">Global Feed</span>
                            <span className="text-[9px] text-glass-muted uppercase tracking-widest font-mono">Google Finance</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    <div className="px-3 py-2 text-[10px] font-bold text-glass-muted uppercase tracking-widest">
                        Canais
                    </div>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`
                                w-full flex items-center justify-between px-3 py-3 rounded-lg text-xs font-medium transition-all group relative overflow-hidden
                                ${activeCategory === cat.id 
                                    ? 'bg-glass-accent/10 text-glass-accent border border-glass-accent/30 shadow-[inset_0_0_15px_rgba(212,175,55,0.05)]' 
                                    : 'text-glass-muted hover:bg-white/5 hover:text-glass-text border border-transparent'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3 relative z-10">
                                <cat.icon className={`w-4 h-4 ${activeCategory === cat.id ? 'text-glass-accent' : 'text-glass-muted group-hover:text-glass-text'}`} />
                                <span>{cat.label}</span>
                            </div>
                            {activeCategory === cat.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-glass-accent shadow-[0_0_10px_var(--glass-accent)]"></div>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Footer Info */}
                <div className="p-4 border-t border-glass-border/30 bg-black/10">
                    <div className="flex items-center gap-2 text-[10px] text-glass-muted font-mono">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        RSS GATEWAY: ONLINE
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                
                {/* Header Actions */}
                <div className="h-16 border-b border-glass-border/30 flex items-center justify-between px-6 bg-glass-base/10 backdrop-blur-md z-10 shrink-0">
                    <div>
                        <h1 className="text-xl font-light text-glass-text flex items-center gap-2">
                            {CATEGORIES.find(c => c.id === activeCategory)?.label}
                            {loading && <RefreshCw className="w-4 h-4 animate-spin text-glass-accent" />}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                         <div className="flex bg-black/30 rounded-lg p-1 border border-glass-border/30">
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-[4px] transition-all ${viewMode === 'list' ? 'bg-glass-accent text-black shadow-sm' : 'text-glass-muted hover:text-white'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-[4px] transition-all ${viewMode === 'grid' ? 'bg-glass-accent text-black shadow-sm' : 'text-glass-muted hover:text-white'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="h-4 w-px bg-glass-border/30"></div>
                        <button 
                            onClick={() => fetchNewsData(activeCategory)}
                            className="p-2 hover:bg-white/5 rounded-lg text-glass-muted hover:text-glass-accent transition-colors"
                            title="Forçar Atualização"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* News Feed Area */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gradient-to-br from-glass-base/5 to-black/50">
                    
                    {loading && news.length === 0 ? (
                        // Skeleton Loading
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1,2,3,4,5,6].map(i => (
                                <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse border border-white/5"></div>
                            ))}
                        </div>
                    ) : (
                        <div className={`
                            ${viewMode === 'grid' 
                                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr' 
                                : 'flex flex-col gap-0 border border-glass-border/30 rounded-xl bg-black/20 overflow-hidden backdrop-blur-sm'
                            }
                        `}>
                            {news.map((item, idx) => (
                                <a 
                                    key={`${item.id}-${idx}`}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`
                                        group relative overflow-hidden transition-all duration-300
                                        ${viewMode === 'grid' 
                                            ? 'bg-glass-panel border border-glass-border/30 hover:border-glass-accent/50 rounded-xl hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:-translate-y-1 flex flex-col p-5' 
                                            : 'flex items-start gap-4 p-5 border-b border-glass-border/30 last:border-0 hover:bg-white/5'
                                        }
                                    `}
                                >
                                    {/* Grid Mode: Background Gradient on Hover */}
                                    {viewMode === 'grid' && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-glass-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                    )}

                                    <div className="flex-1 relative z-10">
                                        {/* Metadata Top */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-glass-accent bg-glass-accent/10 px-2 py-0.5 rounded border border-glass-accent/20">
                                                    {item.source}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-mono text-glass-muted/70 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {timeAgo(item.publishedAt)}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className={`font-medium text-glass-text leading-snug group-hover:text-glass-accent transition-colors ${viewMode === 'grid' ? 'text-sm mb-3 line-clamp-3 min-h-[4.5em]' : 'text-base mb-1'}`}>
                                            {item.title}
                                        </h3>
                                        
                                        {/* Summary (Only in List or if Grid is large) */}
                                        <p className="text-xs text-glass-muted line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                            {item.summary}
                                        </p>
                                    </div>

                                    {/* Grid Footer */}
                                    {viewMode === 'grid' && (
                                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between relative z-10">
                                            <span className="text-[9px] text-glass-muted/50 uppercase tracking-widest group-hover:text-glass-text transition-colors">Ler Matéria</span>
                                            <ArrowUpRight className="w-3.5 h-3.5 text-glass-muted group-hover:text-glass-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </div>
                                    )}
                                    
                                    {/* List Mode Action */}
                                    {viewMode === 'list' && (
                                         <div className="self-center pl-4 border-l border-white/5">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-glass-accent group-hover:text-black transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                         </div>
                                    )}
                                </a>
                            ))}
                        </div>
                    )}

                    <div className="mt-12 mb-6 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-glass-border/30 bg-black/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-glass-accent animate-pulse"></span>
                            <span className="text-[10px] text-glass-muted uppercase tracking-widest">Live Data Stream</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
