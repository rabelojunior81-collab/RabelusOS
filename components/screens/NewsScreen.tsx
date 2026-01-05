import React, { useState, useEffect, useRef } from 'react';
import { Globe, Zap, Terminal, TrendingUp, TrendingDown, Minus, Bot, Loader2, RefreshCw, Eye, X, Rss, ShieldCheck, Activity, Filter, Server, Wifi, Trash2 } from 'lucide-react';
import { analyzeNews, NewsAnalysis } from '../../services/aiService';

// --- Types ---

interface NewsItemData {
  id: string;
  source: string;
  time: number; // timestamp ms
  headline: string;
  content: string; // Description or snippet
  url: string;
  impact: 'high' | 'normal' | 'low';
  relevanceScore: number;
}

interface SystemLog {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

// --- CONFIGURAÇÃO DA ENGINE DE NOTÍCIAS ---

const RSS_SOURCES = [
    { name: 'COINDESK', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', priority: 1 },
    { name: 'COINTELEGRAPH', url: 'https://cointelegraph.com/rss', priority: 1 },
    { name: 'DECRYPT', url: 'https://decrypt.co/feed', priority: 2 },
    { name: 'BITCOIN MAG', url: 'https://bitcoinmagazine.com/.rss/full/', priority: 1 },
    { name: 'THE BLOCK', url: 'https://www.theblock.co/rss', priority: 2 }
];

const RSS_TO_JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

// Palavras-chave para rotina de validação (Peso 2x)
const CRITICAL_KEYWORDS = ['Bitcoin', 'BTC', 'ETF', 'SEC', 'Federal Reserve', 'Powell', 'Binance', 'BlackRock', 'Ethereum', 'Price', 'Market', 'Crypto'];
// Palavras-chave secundárias (Peso 1x)
const SECONDARY_KEYWORDS = ['Solana', 'XRP', 'Regulation', 'Hacked', 'Exploit', 'Rally', 'Crash', 'Bull', 'Bear', 'Volume', 'Coinbase'];

// --- Helpers ---

// CRITICAL FIX: RSS2JSON returns dates as "YYYY-MM-DD HH:mm:ss" which fails in Safari/Firefox.
// Must convert to "YYYY-MM-DDTHH:mm:ss" (ISO)
const parseNewsDate = (dateString: string): number => {
    try {
        if (!dateString) return Date.now();
        // Replace space with T for ISO compliance
        const isoString = dateString.replace(" ", "T");
        const date = new Date(isoString);
        
        // Check if valid
        if (isNaN(date.getTime())) {
             // Fallback: try parsing direct or assume now if failed hard
             const fallback = new Date(dateString);
             return isNaN(fallback.getTime()) ? Date.now() : fallback.getTime();
        }
        return date.getTime();
    } catch (e) {
        return Date.now();
    }
};

// --- Components ---

const SystemLogTerminal = ({ logs }: { logs: SystemLog[] }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-black border-b border-glass-border p-3 font-mono text-[9px] h-40 flex flex-col relative overflow-hidden shadow-inner">
            <div className="absolute top-0 right-0 p-2 opacity-80 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-glass-profit animate-pulse rounded-full"></div>
                 <span className="text-glass-profit font-bold">LIVE_NET</span>
            </div>
            <div className="uppercase tracking-widest text-glass-muted mb-2 border-b border-white/10 pb-1 flex justify-between select-none">
                <span>System.Network.Log</span>
                <span>V.2.1.0 (FIX_DATE)</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5" ref={scrollRef}>
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-2 font-mono leading-tight">
                        <span className="text-gray-600 min-w-[50px]">[{log.timestamp}]</span>
                        <span className={`
                            break-all
                            ${log.type === 'error' ? 'text-red-500 font-bold' : ''}
                            ${log.type === 'success' ? 'text-green-500 font-bold' : ''}
                            ${log.type === 'warning' ? 'text-yellow-500' : ''}
                            ${log.type === 'info' ? 'text-gray-300' : ''}
                        `}>
                            {log.type === 'success' && '>> '}{log.message}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ImpactBadge = ({ level }: { level: 'high' | 'normal' | 'low' }) => {
    const colors = {
        high: 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.6)] border-red-500 animate-pulse',
        normal: 'bg-glass-secondary text-white border-gray-600',
        low: 'bg-glass-border text-glass-text border-gray-300'
    };
    
    return (
        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border ${colors[level]}`}>
            {level === 'high' ? 'CRÍTICO' : level === 'normal' ? 'MERCADO' : 'INFO'}
        </span>
    );
};

const SentimentBadge = ({ type }: { type: 'BULLISH' | 'BEARISH' | 'NEUTRAL' }) => {
    const config = {
        BULLISH: { icon: TrendingUp, color: 'text-glass-profit', bg: 'bg-glass-profit/10', border: 'border-glass-profit/30', label: 'BULLISH' },
        BEARISH: { icon: TrendingDown, color: 'text-glass-loss', bg: 'bg-glass-loss/10', border: 'border-glass-loss/30', label: 'BEARISH' },
        NEUTRAL: { icon: Minus, color: 'text-glass-muted', bg: 'bg-gray-100', border: 'border-gray-200', label: 'NEUTRO' },
    }[type];

    const Icon = config.icon;

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border}`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
            <span className={`text-xs font-black tracking-wider ${config.color}`}>{config.label}</span>
        </div>
    );
};

// --- TradingView Ticker Widget ---
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
            { "proName": "BITSTAMP:BTCUSD", "title": "BTC/USD" },
            { "proName": "BINANCE:ETHUSDT", "title": "ETH/USDT" },
            { "description": "Solana", "proName": "BINANCE:SOLUSDT" },
            { "description": "DXY", "proName": "TVC:DXY" },
            { "description": "Gold", "proName": "TVC:GOLD" }
          ],
          "showSymbolLogo": true,
          "colorTheme": "light",
          "isTransparent": true,
          "displayMode": "adaptive",
          "locale": "br"
        });
        containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full h-10 bg-white/80 border-b border-glass-border overflow-hidden shrink-0 backdrop-blur-md z-50">
        <div className="tradingview-widget-container" ref={containerRef}>
            <div className="tradingview-widget-container__widget"></div>
        </div>
    </div>
  );
};

// --- TradingView Timeline Modal ---
const TradingViewNewsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
        containerRef.current.innerHTML = ''; 
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
          "feedMode": "market",
          "market": "crypto",
          "isTransparent": false,
          "displayMode": "regular",
          "width": "100%",
          "height": "100%",
          "colorTheme": "dark",
          "locale": "br"
        });
        containerRef.current.appendChild(script);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[80vh] bg-[#131722] border border-glass-border shadow-2xl relative flex flex-col rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-[#131722]">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-glass-accent" />
                Feed Global TradingView
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>
        <div className="flex-1 relative bg-[#131722]" ref={containerRef}>
             <div className="tradingview-widget-container w-full h-full">
                <div className="tradingview-widget-container__widget w-full h-full"></div>
             </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Screen ---

export const NewsScreen: React.FC = () => {
  const [news, setNews] = useState<NewsItemData[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItemData | null>(null);
  const [analysis, setAnalysis] = useState<NewsAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [showTVModal, setShowTVModal] = useState(false);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // Logger helper
  const addLog = (message: string, type: SystemLog['type'] = 'info') => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    
    setLogs(prev => [...prev.slice(-100), { // Keep last 100 logs
        id: Date.now() + Math.random(),
        message,
        type,
        timestamp: timeString
    }]);
  };

  // --- ENGINE DE NOTÍCIAS COM VALIDAÇÃO ---
  const fetchLiveFeeds = async () => {
    if (loadingNews) return;
    setLoadingNews(true);
    addLog('>>> INICIANDO PROTOCOLO DE SINCRONIZAÇÃO...', 'warning');
    
    const allNews: NewsItemData[] = [];
    let successCount = 0;
    
    // 1. Array de Promises para buscar todos os feeds
    const fetchPromises = RSS_SOURCES.map(async (source) => {
        addLog(`[CONNECT] ${source.name}...`, 'info');
        try {
            // Using a cache buster timestamp to prevent browser caching of the fetch
            const cacheBuster = `&_=${Date.now()}`;
            const res = await fetch(`${RSS_TO_JSON_API}${encodeURIComponent(source.url)}${cacheBuster}`);
            const data = await res.json();
            
            if (data.status === 'ok' && data.items) {
                successCount++;
                return data.items.map((item: any) => {
                    const title = item.title;
                    const rawContent = item.content || item.description || "";
                    const pubDateStr = item.pubDate; // "2024-05-20 10:10:10"
                    const time = parseNewsDate(pubDateStr);
                    
                    // Log date parsing for debug
                    // if (Math.random() > 0.9) addLog(`DEBUG DATE: ${pubDateStr} -> ${new Date(time).toLocaleTimeString()}`, 'info');

                    // VALIDATION ROUTINE: SCORE CALCULATION
                    let score = 0;
                    CRITICAL_KEYWORDS.forEach(kw => {
                         if (new RegExp(kw, 'i').test(title)) score += 20;
                         if (new RegExp(kw, 'i').test(rawContent)) score += 5;
                    });
                    SECONDARY_KEYWORDS.forEach(kw => {
                        if (new RegExp(kw, 'i').test(title)) score += 10;
                        if (new RegExp(kw, 'i').test(rawContent)) score += 2;
                   });

                   // Determine clean content
                   const cleanContent = rawContent.replace(/<img[^>]*>/g,"").replace(/<[^>]+>/g, '').trim();

                    return {
                        id: item.guid || item.link,
                        source: source.name,
                        time: time,
                        headline: title,
                        content: cleanContent.length > 50 ? cleanContent : title,
                        url: item.link,
                        impact: score > 25 ? 'high' : score > 10 ? 'normal' : 'low',
                        relevanceScore: score
                    } as NewsItemData;
                });
            } else {
                throw new Error('JSON Inválido');
            }
        } catch (err) {
            addLog(`[FALHA] ${source.name}: Connection Refused.`, 'error');
            return [];
        }
    });

    try {
        const results = await Promise.all(fetchPromises);
        
        // Flatten
        results.forEach(feedItems => allNews.push(...feedItems));

        addLog(`[BUFFER] ${allNews.length} pacotes brutos recebidos.`, 'info');

        // 2. FILTRAGEM E ORDENAÇÃO (VALIDATION)
        const validatedNews = allNews
            .filter(item => {
                // Drop items older than 3 days to ensure freshness
                const isFresh = (Date.now() - item.time) < (1000 * 60 * 60 * 24 * 3);
                return item.headline.length > 10 && isFresh; 
            })
            // Sort by Time DESC
            .sort((a, b) => b.time - a.time)
            // Deduplicate
            .filter((item, index, self) => 
                index === self.findIndex((t) => t.headline === item.headline)
            );

        addLog(`[INDEX] ${validatedNews.length} manchetes validadas.`, 'success');
        
        if (validatedNews.length > 0) {
            addLog(`[LATEST] Topo: ${new Date(validatedNews[0].time).toLocaleTimeString()}`, 'success');
            setNews(validatedNews);
        } else {
             addLog(`[ALERTA] Nenhum dado recente encontrado. Verifique conexão.`, 'warning');
        }

    } catch (e) {
        addLog('ERRO CRÍTICO NA ENGINE DE DADOS.', 'error');
    } finally {
        setLoadingNews(false);
    }
  };

  const clearAndReload = () => {
      setNews([]);
      setSelectedNews(null);
      setAnalysis(null);
      addLog('>>> BUFFER LIMPO MANUALMENTE pelo Operador.', 'error');
      fetchLiveFeeds();
  };

  // Initial Fetch
  useEffect(() => {
    fetchLiveFeeds();
    const interval = setInterval(fetchLiveFeeds, 60000); 
    return () => clearInterval(interval);
  }, []);

  const handleSelectNews = (item: NewsItemData) => {
    setSelectedNews(item);
    setAnalysis(null);
  };

  const handleInvokeJoaca = async () => {
    if (!selectedNews) return;
    
    setLoadingAnalysis(true);
    setAnalysis(null);
    addLog(`[AI_REQUEST] Enviando payload para Agente Joaca...`, 'warning');
    
    try {
        const result = await analyzeNews(selectedNews.headline, selectedNews.content);
        setAnalysis(result);
        addLog('[AI_RESPONSE] Análise Neural concluída com sucesso.', 'success');
    } catch (e) {
        console.error(e);
        addLog('[AI_FAIL] Falha na resposta do Agente.', 'error');
    } finally {
        setLoadingAnalysis(false);
    }
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return "DATA??";
    
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return `AGORA`;
    if (diffMins < 60) return `${diffMins}m`;
    
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative bg-[#f0f2f5]">
        <TradingViewNewsModal isOpen={showTVModal} onClose={() => setShowTVModal(false)} />

        <TradingViewTicker />

        <div className="flex flex-1 overflow-hidden">
            {/* --- LEFT COLUMN: News Feed (380px fixed) --- */}
            <div className="w-[380px] flex-shrink-0 flex flex-col border-r border-glass-border bg-white z-20 shadow-xl">
                
                {/* 1. Terminal Log (Topo da lista) */}
                <SystemLogTerminal logs={logs} />

                {/* 2. Controls */}
                <div className="p-3 border-b border-glass-border bg-gray-50 flex justify-between items-center shadow-sm relative z-10">
                    <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${loadingNews ? 'bg-yellow-400 animate-ping' : 'bg-green-500'}`}></div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-glass-text">
                            {loadingNews ? 'Buscando Dados...' : 'Rede Segura'}
                         </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={clearAndReload}
                            className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors rounded"
                            title="Limpar Buffer e Recarregar"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={fetchLiveFeeds} 
                            className="p-1.5 hover:bg-glass-accent text-glass-muted hover:text-white transition-colors rounded"
                            title="Sincronizar Agora"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingNews ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* 3. News List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50">
                    {news.length === 0 && !loadingNews && (
                         <div className="p-8 text-center text-glass-muted opacity-50 text-xs font-mono">
                             Nenhum dado no buffer.<br/>Verifique conexão.
                         </div>
                    )}
                    
                    {news.map((item) => (
                        <div 
                            key={item.id}
                            onClick={() => handleSelectNews(item)}
                            className={`
                                p-4 border-b border-glass-border cursor-pointer transition-all duration-200 group relative
                                ${selectedNews?.id === item.id 
                                    ? 'bg-white shadow-[inset_4px_0_0_#C5A059] z-10' 
                                    : 'hover:bg-white/80'
                                }
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[9px] font-black uppercase tracking-wider ${selectedNews?.id === item.id ? 'text-glass-accent' : 'text-glass-secondary'}`}>
                                    {item.source}
                                </span>
                                <span className={`text-[9px] font-mono font-bold ${item.time > Date.now() - 3600000 ? 'text-glass-profit' : 'text-glass-muted'}`} title={new Date(item.time).toLocaleString()}>
                                    {formatTime(item.time)}
                                </span>
                            </div>
                            
                            <h3 className={`text-xs font-bold leading-snug transition-colors line-clamp-3 mb-2 ${selectedNews?.id === item.id ? 'text-black' : 'text-glass-text/80'}`}>
                                {item.headline}
                            </h3>

                            <div className="flex items-center gap-2 mt-2">
                                {item.impact === 'high' && <ImpactBadge level="high" />}
                                {item.relevanceScore > 30 && (
                                    <span className="flex items-center gap-1 text-[9px] text-glass-accent font-bold bg-glass-accent/5 px-1.5 py-0.5 rounded border border-glass-accent/20">
                                        <ShieldCheck className="w-3 h-3" /> KEY_SIGNAL
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                 {/* 4. Footer Button */}
                 <div className="p-3 border-t border-glass-border bg-white shadow-[0_-5px_15px_rgba(0,0,0,0.02)] z-20">
                    <button 
                        onClick={() => setShowTVModal(true)}
                        className="w-full py-2 bg-[#131722] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Eye className="w-3 h-3 text-glass-accent" />
                        Verificar no TradingView
                    </button>
                 </div>
            </div>

            {/* --- RIGHT COLUMN: Content (Fluid) --- */}
            <div className="flex-1 bg-glass-base/30 overflow-y-auto relative flex flex-col backdrop-blur-sm">
                
                {!selectedNews ? (
                    <div className="m-auto flex flex-col items-center justify-center text-glass-muted opacity-60 select-none p-10 text-center">
                        <div className="w-24 h-24 rounded-full border border-dashed border-glass-text flex items-center justify-center mb-6 animate-spin-slow">
                             <Server className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-light uppercase tracking-[0.2em] mb-2">Terminal de Inteligência</h2>
                        <p className="text-xs font-mono max-w-md leading-relaxed mb-6">
                            O sistema está monitorando {RSS_SOURCES.length} nós globais. Selecione um pacote de dados à esquerda para descriptografar e analisar o conteúdo.
                        </p>
                        <div className="flex gap-4 text-[10px] font-mono uppercase text-glass-muted/70">
                             <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> RSS STREAM: ON</span>
                             <span className="flex items-center gap-1"><Bot className="w-3 h-3" /> JOACA AI: READY</span>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
                        {/* Header Content */}
                        <div className="mb-6 flex items-start justify-between border-b border-glass-border pb-6">
                            <div className="max-w-[80%]">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-0.5 bg-glass-text text-white text-[10px] font-bold uppercase tracking-wider">{selectedNews.source}</span>
                                    {selectedNews.impact === 'high' && <span className="flex items-center gap-1 text-red-500 text-[10px] font-bold uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded border border-red-100"><Zap className="w-3 h-3 fill-current" /> High Impact</span>}
                                </div>
                                <h1 className="text-2xl md:text-3xl font-light text-glass-text leading-tight tracking-tight">
                                    {selectedNews.headline}
                                </h1>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-mono text-glass-muted opacity-30 font-bold tracking-tighter">
                                    {new Date(selectedNews.time).getHours().toString().padStart(2,'0')}
                                    <span className="animate-pulse">:</span>
                                    {new Date(selectedNews.time).getMinutes().toString().padStart(2,'0')}
                                </div>
                                <a href={selectedNews.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-glass-accent hover:underline flex items-center justify-end gap-1 mt-2 font-bold uppercase tracking-wider">
                                    LER ORIGINAL <Globe className="w-3 h-3" />
                                </a>
                            </div>
                        </div>

                        {/* Raw Content Box */}
                        <div className="glass-panel p-8 bg-white/70 mb-8 shadow-sm relative overflow-hidden group border-l-4 border-glass-secondary">
                            <div className="absolute top-2 right-2 opacity-5">
                                <Rss className="w-16 h-16" />
                            </div>
                            <p className="whitespace-pre-line text-lg text-glass-text/90 font-serif leading-relaxed">
                                {selectedNews.content}
                            </p>
                        </div>

                        {/* AI Action Area */}
                        <div className="flex justify-center mb-12">
                            <button 
                                onClick={handleInvokeJoaca}
                                disabled={loadingAnalysis}
                                className={`
                                    group relative px-12 py-4 bg-glass-secondary hover:bg-glass-text text-white transition-all shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] overflow-hidden
                                    ${loadingAnalysis ? 'cursor-wait opacity-90' : 'hover:-translate-y-1'}
                                `}
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-glass-accent to-transparent opacity-50"></div>
                                {/* Shine Effect */}
                                <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"></div>
                                
                                <div className="flex items-center gap-3 relative z-20">
                                    {loadingAnalysis ? <Loader2 className="w-5 h-5 animate-spin text-glass-accent" /> : <Bot className="w-5 h-5 text-glass-accent" />}
                                    <span className="font-bold text-xs uppercase tracking-[0.2em]">
                                        {loadingAnalysis ? 'Decodificando...' : 'Invocar Análise Joaca'}
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* Analysis Card */}
                        {analysis && (
                            <div className="relative bg-[#FFFCF5] border border-glass-accent p-1 shadow-2xl animate-in zoom-in-95 duration-500 max-w-3xl mx-auto hover:scale-[1.01] transition-transform duration-500">
                                {/* Tape */}
                                <div className="absolute -top-3 inset-x-0 flex justify-center z-30">
                                    <div className="bg-glass-accent text-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] shadow-md border border-white/20 transform -skew-x-12">
                                        Análise Confidencial
                                    </div>
                                </div>

                                <div className="border border-glass-accent/20 p-8 flex flex-col gap-6 relative bg-[url('https://www.transparenttextures.com/patterns/cardboard.png')]">
                                    {/* Watermark */}
                                    <div className="absolute right-0 bottom-0 opacity-[0.05] pointer-events-none">
                                        <Bot className="w-64 h-64 -rotate-12 translate-x-10 translate-y-10" />
                                    </div>

                                    {/* Top Metadata */}
                                    <div className="flex justify-between items-center border-b border-glass-accent/10 pb-4 relative z-10">
                                        <SentimentBadge type={analysis.sentiment} />
                                        <div className="flex gap-2">
                                            {analysis.tags.map(tag => (
                                                <span key={tag} className="text-[9px] font-mono text-glass-muted uppercase tracking-wider border border-glass-muted/20 px-1.5 py-0.5 rounded">#{tag}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Core Content */}
                                    <div className="space-y-6 relative z-10">
                                        <div>
                                            <h4 className="text-[10px] text-glass-accent font-black uppercase mb-2 flex items-center gap-2">
                                                <Activity className="w-3 h-3" /> Resumo Tático
                                            </h4>
                                            <p className="text-sm font-medium text-glass-text leading-relaxed text-justify border-l-2 border-glass-muted/20 pl-4">
                                                {analysis.summary}
                                            </p>
                                        </div>

                                        <div className="bg-glass-secondary text-white p-6 shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] relative mt-4 rounded-sm">
                                            <div className="absolute -top-3 -left-2 bg-glass-accent text-white px-2 py-1 text-[9px] font-bold shadow-sm uppercase tracking-wider">
                                                Opinião do Agente
                                            </div>
                                            <p className="text-sm font-bold italic leading-relaxed opacity-95 font-serif">
                                                "{analysis.sarcastic_comment}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};