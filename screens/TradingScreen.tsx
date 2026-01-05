
import React, { useEffect, useRef, useState } from 'react';
import { BarChart2, Globe, Layers, LayoutGrid, Activity } from 'lucide-react';

type Tab = 'tradingview' | 'coingecko' | 'dexscreener' | 'cryptobubbles';

export const TradingScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('tradingview');
  const scriptLoadedRef = useRef(false);

  // Initialize Widgets Scripts
  useEffect(() => {
    // Only load scripts once
    if (scriptLoadedRef.current) return;

    // 1. TradingView Script
    const scriptTV = document.createElement('script');
    scriptTV.src = 'https://s3.tradingview.com/tv.js';
    scriptTV.async = true;
    scriptTV.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          "autosize": true,
          "symbol": "BINANCE:BTCUSDT",
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": "dark", 
          "style": "1",
          "locale": "br",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "allow_symbol_change": true,
          "container_id": "tradingview_widget",
          "hide_side_toolbar": false,
          "details": true,
          "hotlist": true,
          "calendar": true,
        });
      }
    };
    document.head.appendChild(scriptTV);

    // 2. CoinGecko Script
    const scriptCG = document.createElement('script');
    scriptCG.src = "https://widgets.coingecko.com/gecko-coin-list-widget.js";
    scriptCG.async = true;
    document.head.appendChild(scriptCG);

    scriptLoadedRef.current = true;
  }, []);

  const renderTabButton = (id: Tab, label: string, Icon: any) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`
          flex items-center gap-2 px-4 h-full text-[10px] font-bold uppercase tracking-widest transition-all relative group
          ${isActive 
            ? 'text-glass-accent bg-white/5' 
            : 'text-glass-muted hover:text-glass-text hover:bg-white/5'
          }
        `}
      >
        <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-glass-accent' : 'text-glass-muted group-hover:text-glass-text'}`} />
        {label}
        
        {/* Active Indicator */}
        {isActive && (
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-glass-accent shadow-[0_0_8px_currentColor]"></div>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0F172A]">
      {/* Top Bar - Dark Theme Integrated */}
      <div className="h-10 bg-glass-base/90 border-b border-glass-border flex items-center px-4 shrink-0 z-10 backdrop-blur-xl">
        
        <div className="flex items-center gap-2 mr-6 text-glass-accent opacity-80">
            <Activity className="w-4 h-4" />
        </div>

        <div className="flex h-full items-center mr-auto">
            {renderTabButton('tradingview', 'TradingView Pro', BarChart2)}
            {renderTabButton('coingecko', 'CoinGecko Market', Globe)}
            {renderTabButton('dexscreener', 'Dex Screener', Layers)}
            {renderTabButton('cryptobubbles', 'Crypto Bubbles', LayoutGrid)}
        </div>
        
        <div className="flex items-center gap-3 pl-6 border-l border-glass-border/30 h-1/2">
           <div className="flex items-center gap-2 text-glass-muted text-[9px] font-mono uppercase tracking-wider">
             <div className="w-1.5 h-1.5 rounded-full bg-glass-profit animate-pulse shadow-[0_0_6px_#10b981]"></div>
             Data Stream: <span className="text-glass-text font-bold">Live</span>
           </div>
        </div>
      </div>

      {/* Content Area - Full Bleed */}
      <div className="flex-1 relative bg-black overflow-hidden">
            
        {/* Tab 1: TradingView Container */}
        <div 
            id="tradingview_widget" 
            className="w-full h-full"
            style={{ display: activeTab === 'tradingview' ? 'block' : 'none' }}
        ></div>

        {/* Tab 2: CoinGecko Widget */}
        <div 
            className="w-full h-full bg-[#111827] overflow-auto custom-scrollbar"
            style={{ display: activeTab === 'coingecko' ? 'block' : 'none' }}
        >
             <div className="max-w-[1400px] mx-auto p-6">
                {/* @ts-ignore */}
                <gecko-coin-list-widget locale="pt" outlined="true" coin-ids="" initial-currency="usd"></gecko-coin-list-widget>
            </div>
        </div>

        {/* Tab 3: DexScreener */}
        <div 
            className="w-full h-full bg-[#101113]"
            style={{ display: activeTab === 'dexscreener' ? 'block' : 'none' }}
        >
            <iframe 
                src="https://dexscreener.com/solana/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN?embed=1&theme=dark"
                title="DexScreener"
                className="w-full h-full border-0"
            />
        </div>

        {/* Tab 4: Crypto Bubbles */}
        <div 
            className="w-full h-full bg-[#101113]"
            style={{ display: activeTab === 'cryptobubbles' ? 'block' : 'none' }}
        >
            <iframe 
                src="https://cryptobubbles.net"
                title="Crypto Bubbles"
                className="w-full h-full border-0"
            />
        </div>

      </div>
    </div>
  );
};

declare global {
  interface Window {
    TradingView: any;
  }
}
