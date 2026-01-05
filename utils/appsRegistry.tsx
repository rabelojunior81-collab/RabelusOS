
import React from 'react';
import { LayoutDashboard, CandlestickChart, Newspaper, ShoppingBag, Settings, BookOpen, Bot, BrainCircuit, Database, Wallet, PenTool, Sparkles, Eye, Fingerprint, HardHat, BarChart3, Mic, Youtube, FileText, Layers, Image as ImageIcon, Video } from 'lucide-react';
import { AppDefinition } from '../types';

// App Components
import { DashboardScreen } from '../screens/DashboardScreen';
import { TradingScreen } from '../screens/TradingScreen';
import { NewsScreen } from '../screens/NewsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { StoreApp } from '../apps/StoreApp';
import { HubWindow } from '../components/HubWindow';
import { YoutubeWidget } from '../components/YoutubeWidget';
import { NotepadApp } from '../apps/NotepadApp';

// Helper for iframe apps
const IframeApp = ({ src, title }: { src: string, title: string }) => (
    <div className="w-full h-full bg-[#050508] overflow-hidden flex flex-col">
        <iframe 
            src={src}
            title={title}
            className="w-full h-full border-0"
            allow="microphone *; camera *; clipboard-write *"
        />
    </div>
);

// The Registry - Maps IDs to Visual Components
export const APP_REGISTRY: Record<string, AppDefinition> = {
    dashboard: { 
        id: 'dashboard', 
        label: 'Home', 
        icon: LayoutDashboard, 
        component: <DashboardScreen />, 
        defaultWidth: 1000, 
        defaultHeight: 700 
    },
    hub: {
        id: 'hub',
        label: 'Rabelus Hub',
        icon: Mic,
        component: <HubWindow />,
        defaultWidth: 500,
        defaultHeight: 700
    },
    notepad: {
        id: 'notepad',
        label: 'Rabelus Editor',
        icon: FileText,
        component: <NotepadApp />,
        defaultWidth: 600,
        defaultHeight: 500
    },
    youtube: {
        id: 'youtube',
        label: 'Rabelus Media',
        icon: Youtube,
        component: <YoutubeWidget />, // Note: App.tsx may render this specially
        defaultWidth: 420,
        defaultHeight: 240
    },
    store: {
        id: 'store',
        label: 'Rabelus Store',
        icon: ShoppingBag,
        component: <StoreApp />,
        defaultWidth: 1100, // Aumentado para o novo layout Play Store
        defaultHeight: 750
    },
    trading: { 
        id: 'trading', 
        label: 'Trade', 
        icon: CandlestickChart, 
        component: <TradingScreen />, 
        defaultWidth: 1100, 
        defaultHeight: 800 
    },
    news: { 
        id: 'news', 
        label: 'News', 
        icon: Newspaper, 
        component: <NewsScreen />, 
        defaultWidth: 900, 
        defaultHeight: 700 
    },
    settings: { 
        id: 'settings', 
        label: 'Ajustes', 
        icon: Settings, 
        component: <SettingsScreen />, 
        defaultWidth: 800, 
        defaultHeight: 500 
    },
    // AI APPS RABELUS LAB - URLS ATUALIZADAS
    hermes_ai: {
        id: 'hermes_ai',
        label: 'Hermes.ai',
        icon: Wallet,
        component: <IframeApp src="https://hermes-ai-by-rabelus-751639953357.us-west1.run.app/" title="Hermes.ai" />,
        defaultWidth: 1000, 
        defaultHeight: 800
    },
    helena_ai: {
        id: 'helena_ai',
        label: 'Helena.ai',
        icon: PenTool,
        component: <IframeApp src="https://helena-ai-by-rabelus-751639953357.us-west1.run.app/" title="Helena.ai" />,
        defaultWidth: 1000, 
        defaultHeight: 800
    },
    excelsior_ai: {
        id: 'excelsior_ai',
        label: 'Excelsior.ai',
        icon: Layers,
        component: <IframeApp src="https://excelsior-ai-by-rabelus-v1-0s-751639953357.us-west1.run.app/" title="Excelsior.ai" />,
        defaultWidth: 1000, 
        defaultHeight: 800
    },
    tubemaster_ai: {
        id: 'tubemaster_ai',
        label: 'Tubemaster.ai',
        icon: Video,
        component: <IframeApp src="https://tubemaster-ai-3-0-751639953357.us-west1.run.app/" title="Tubemaster.ai" />,
        defaultWidth: 1000, 
        defaultHeight: 800
    },
    // LEGACY & OTHERS
    christian_ai: { 
        id: 'christian_ai', 
        label: 'Christian AI', 
        icon: BookOpen, 
        component: <IframeApp src="https://christian-ai-by-rabelus-751639953357.us-west1.run.app/" title="Christian AI" />, 
        defaultWidth: 1000, 
        defaultHeight: 800 
    },
    joaca_ai: { 
        id: 'joaca_ai', 
        label: 'Joaca AI (Legacy)', 
        icon: Bot, 
        component: <IframeApp src="https://joaca-ai-by-rabelus-751639953357.us-west1.run.app/" title="Joaca AI" />, 
        defaultWidth: 1000, 
        defaultHeight: 800 
    },
    joaca_pro: { 
        id: 'joaca_pro', 
        label: 'Joaca.ai', 
        icon: Bot, 
        component: <IframeApp src="https://joaca-ai-by-rabelus-751639953357.us-west1.run.app/" title="Joaca.ai" />, 
        defaultWidth: 1000, 
        defaultHeight: 800 
    },
    logus_ai: { 
        id: 'logus_ai', 
        label: 'Logus Vision', 
        icon: BrainCircuit, 
        component: <IframeApp src="https://logus-vision-pro-by-rabelus-751639953357.us-west1.run.app/" title="Logus Vision" />, 
        defaultWidth: 1000, 
        defaultHeight: 800 
    },
    didata_ai: { 
        id: 'didata_ai', 
        label: 'Didata.ai', 
        icon: Database,
        component: <IframeApp src="https://didata-ai-by-rabelus-751639953357.us-west1.run.app/" title="Didata.ai" />, 
        defaultWidth: 1000, 
        defaultHeight: 800 
    },
    talia_ai: {
        id: 'talia_ai',
        label: 'Talia AI',
        icon: Sparkles,
        component: <IframeApp src="https://dev-talia-ai-by-rabelus-751639953357.us-west1.run.app/" title="Talia AI" />,
        defaultWidth: 1000, 
        defaultHeight: 800
    },
    fatima_ai: {
        id: 'fatima_ai',
        label: 'Fatima AI',
        icon: Eye,
        component: <IframeApp src="https://fatima-ai-by-rabelus-751639953357.us-west1.run.app/" title="Fatima AI" />,
        defaultWidth: 1000, 
        defaultHeight: 800
    },
    enok_ai: {
        id: 'enok_ai',
        label: 'Enok.ai',
        icon: Fingerprint,
        component: <IframeApp src="https://enok-ai-by-rabelus-v1-0-751639953357.us-west1.run.app/" title="Enok.ai" />,
        defaultWidth: 1000, 
        defaultHeight: 800
    }
};
