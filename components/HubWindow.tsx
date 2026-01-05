import React, { useRef, useEffect, useState } from 'react';
import { Mic, Volume2, MicOff, Zap, Activity, Radio, ChevronDown, User, Bot } from 'lucide-react';
import { useGeminiLive, VOICES } from '../hooks/useGeminiLive';
import { LiquidSphere } from './LiquidSphere';

export const HubWindow: React.FC = () => {
  const { 
    isConnected,
    isStreaming,
    history,
    toggleMic,
    audioStreamer,
    volume,
    setVolume,
    selectedVoice,
    setSelectedVoice
  } = useGeminiLive();

  const scrollRef = useRef<HTMLDivElement>(null);
  const voiceDropdownRef = useRef<HTMLDivElement>(null);
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);

  // Auto-scroll logic (smart scroll)
  useEffect(() => {
    if (scrollRef.current) {
        const { scrollHeight, scrollTop, clientHeight } = scrollRef.current;
        // Only scroll if already near bottom or if it's a new user message
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        if (isNearBottom || history[history.length - 1]?.role === 'user') {
            scrollRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
        }
    }
  }, [history]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(event.target as Node)) {
            setIsVoiceDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-black relative overflow-hidden text-glass-text select-none">
        
        {/* Background Ambient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-black opacity-60"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 mix-blend-overlay"></div>

        {/* --- TOP BAR CONTROLS --- */}
        <div className="relative z-20 h-14 border-b border-glass-border bg-glass-base/40 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
            
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full border transition-colors ${isConnected ? 'bg-green-500/20 border-green-500/30' : 'bg-glass-accent/10 border-glass-accent/20'}`}>
                    <Activity className={`w-4 h-4 ${isConnected ? 'text-green-400' : 'text-glass-accent'}`} />
                </div>
                <div>
                    <h1 className="text-xs font-black uppercase tracking-[0.2em] text-white">Rabelus Hub</h1>
                    <span className="text-[9px] text-glass-muted font-mono flex items-center gap-1">
                        {isConnected ? <span className="text-green-500">● LIVE</span> : 'DISCONNECTED'}
                        <span className="opacity-50">| Gemini 2.5 Flash Live</span>
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Voice Selector */}
                <div className="relative" ref={voiceDropdownRef}>
                    <button 
                        onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-mono transition-all duration-200 
                        ${isVoiceDropdownOpen 
                            ? 'bg-glass-accent text-black border-glass-accent' 
                            : 'bg-black/20 border-white/5 text-glass-muted hover:border-glass-accent/30 hover:text-glass-text'
                        }`}
                    >
                         <span className="uppercase">{selectedVoice}</span>
                         <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isVoiceDropdownOpen ? 'rotate-180' : 'opacity-50'}`} />
                    </button>
                    
                    {/* Dropdown */}
                    {isVoiceDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-32 bg-[#050508] border border-glass-border rounded-lg shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-150 ring-1 ring-white/10">
                            <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                                {VOICES.map(voice => (
                                    <button
                                        key={voice}
                                        onClick={() => { setSelectedVoice(voice); setIsVoiceDropdownOpen(false); }}
                                        className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase rounded-[4px] hover:bg-glass-accent hover:text-black transition-colors flex justify-between items-center ${selectedVoice === voice ? 'text-glass-accent bg-white/5' : 'text-glass-muted'}`}
                                    >
                                        {voice}
                                        {selectedVoice === voice && <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_5px_currentColor]" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Latency Indicator */}
                {isConnected && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-black/20 rounded-full border border-white/5 text-[9px] font-mono text-glass-muted">
                        <Zap className="w-3 h-3 text-yellow-400 fill-current" />
                        <span>~45ms</span>
                    </div>
                )}

                {/* Volume */}
                <div className="flex items-center gap-2 group">
                    <Volume2 className="w-4 h-4 text-glass-muted group-hover:text-glass-accent transition-colors" />
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1" 
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-16 h-1 bg-glass-border rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-glass-accent [&::-webkit-slider-thumb]:appearance-none"
                    />
                </div>
            </div>
        </div>

        {/* --- MAIN VISUALIZER (Takes less space now to accommodate chat) --- */}
        <div className="relative h-[45%] flex items-center justify-center border-b border-glass-border/20 bg-black/20">
            {/* The Liquid Engine */}
            <div className="w-full h-full max-w-[400px] max-h-[400px] absolute inset-0 m-auto flex items-center justify-center opacity-80">
                <LiquidSphere 
                    state={isStreaming ? 'active' : 'idle'} 
                    streamer={audioStreamer}
                    width={400} 
                    height={400} 
                />
            </div>

            {/* Mic Toggle (Floating) */}
            <button 
                onClick={toggleMic}
                className={`
                    relative z-30 w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.5)]
                    ${isStreaming 
                        ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20 scale-110' 
                        : 'bg-glass-panel border-glass-border text-glass-accent hover:border-glass-accent hover:bg-glass-accent/10 hover:scale-105'
                    }
                `}
            >
                {isStreaming ? (
                    <div className="relative">
                        <span className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-20"></span>
                        <Mic className="w-6 h-6 fill-current" />
                    </div>
                ) : (
                    <MicOff className="w-6 h-6" />
                )}
            </button>
            
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                <p className={`text-[9px] uppercase tracking-[0.3em] font-bold transition-colors duration-500 ${isStreaming ? 'text-glass-accent' : 'text-glass-muted'}`}>
                    {isStreaming ? 'Conexão Neural Ativa' : 'Standby'}
                </p>
            </div>
        </div>

        {/* --- PERSISTENT CHAT HISTORY --- */}
        <div className="flex-1 bg-glass-base/60 backdrop-blur-xl flex flex-col relative z-20 overflow-hidden">
            <div className="px-6 py-2 border-b border-white/5 bg-black/20 flex justify-between items-center shrink-0">
                <span className="text-[9px] font-bold text-glass-muted uppercase tracking-widest flex items-center gap-2">
                    <Radio className="w-3 h-3 text-glass-accent" />
                    Protocolo de Memória
                </span>
                <span className="text-[9px] font-mono text-glass-muted/50">Stored locally</span>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar scroll-smooth">
                {history.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-glass-muted/30 gap-2">
                        <Bot className="w-8 h-8 opacity-20" />
                        <span className="text-xs italic">Nenhum registro de memória. Inicie a conversa.</span>
                    </div>
                )}
                
                {history.map((msg, idx) => (
                    <div 
                        key={msg.id} 
                        className={`flex w-full animate-in slide-in-from-bottom-2 fade-in duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            
                            {/* Avatar */}
                            <div className={`
                                w-6 h-6 rounded-full flex items-center justify-center shrink-0 border mt-1
                                ${msg.role === 'user' 
                                    ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-400' 
                                    : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400'
                                }
                            `}>
                                {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                            </div>

                            {/* Bubble */}
                            <div className={`
                                flex flex-col rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm backdrop-blur-sm border
                                ${msg.role === 'user' 
                                    ? 'bg-cyan-500/5 border-cyan-500/20 text-cyan-50 rounded-tr-sm' 
                                    : 'bg-[#FFD700]/5 border-[#FFD700]/10 text-glass-text rounded-tl-sm'
                                }
                            `}>
                                <div className={`text-[8px] font-bold uppercase tracking-wide mb-1 opacity-50 ${msg.role === 'user' ? 'text-right text-cyan-300' : 'text-left text-yellow-500'}`}>
                                    {msg.role === 'user' ? 'Adilson' : 'Rabelus Hub'} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};