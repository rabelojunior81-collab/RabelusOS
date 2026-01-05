

import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, Cpu, ShieldCheck, Terminal, Wifi } from 'lucide-react';

interface SplashScreenProps {
  onComplete: (name: string) => void;
  savedName?: string;
  hasSession: boolean;
}

// System Boot Logs simulation
const BOOT_LOGS = [
    "RABELUS_KERNEL_INIT... OK",
    "LOADING_OBSIDIAN_UI... OK",
    "CHECKING_MEMORY_INTEGRITY... 128GB OK",
    "CONNECTING_NEURAL_NET... ESTABLISHED",
    "DECRYPTING_SECURE_VAULT... SUCCESS",
    "MOUNTING_RABELUS_OS_V3.0... DONE",
    "SYSTEM_READY."
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, savedName, hasSession }) => {
  const [phase, setPhase] = useState(0); 
  // 0: Black, 1: BIOS Text, 2: Logo Reveal, 3: Input/Welcome, 4: Exit
  
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(savedName || '');
  const [isExiting, setIsExiting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- SEQUENCE CONTROLLER ---
  useEffect(() => {
    // Phase 1: BIOS Text (Starts at 1.5s)
    const t1 = setTimeout(() => {
        setPhase(1);
        startBootText();
    }, 1500);

    // Phase 2: Logo Reveal (Starts at 5s - Gives time to read text)
    const t2 = setTimeout(() => setPhase(2), 6000);

    // Phase 3: Interaction or Auto-Login (Starts at 10s)
    const t3 = setTimeout(() => {
        setPhase(3);
    }, 11000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [hasSession, savedName]);

  // Simulate Typing BIOS text
  const startBootText = () => {
      let delay = 0;
      BOOT_LOGS.forEach((line, index) => {
          delay += Math.random() * 500 + 200; // Random typing speed
          setTimeout(() => {
              setBootLines(prev => [...prev, line]);
          }, delay);
      });
  };

  // Auto-focus input
  useEffect(() => {
    if (phase === 3 && !hasSession) {
        setTimeout(() => inputRef.current?.focus(), 500);
    }
  }, [phase, hasSession]);

  const requestFullscreen = () => {
      try {
          if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(err => {
                  console.log(`Error attempting to enable full-screen mode: ${err.message}`);
              });
          }
      } catch (e) {
          // Ignore, feature not available
      }
  };

  const triggerExit = (name: string) => {
    requestFullscreen(); // FORCE FULLSCREEN ON MOBILE
    setIsExiting(true);
    setTimeout(() => {
        onComplete(name);
    }, 2000); // Slow fade out
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;
    triggerExit(inputValue);
  };

  // Handle auto-login via button click instead of timeout to allow fullscreen trigger
  const handleAutoLogin = () => {
      if (savedName) triggerExit(savedName);
  };

  return (
    <div className={`fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center overflow-hidden transition-all duration-[2000ms] ease-in-out ${isExiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}>
        
        {/* CRT Scanline Effect */}
        <div className="absolute inset-0 z-50 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 z-50 pointer-events-none bg-gradient-to-b from-transparent via-white/5 to-transparent bg-[length:100%_4px] animate-scanline"></div>

        {/* Ambient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0f1016] via-[#000] to-[#000] opacity-80"></div>

        {/* --- PHASE 1: BIOS BOOT TEXT (Top Left) --- */}
        <div className={`absolute top-10 left-10 font-mono text-[10px] md:text-xs text-white/70 space-y-1 transition-opacity duration-500 ${phase >= 1 && phase < 3 ? 'opacity-100' : 'opacity-0'}`}>
            {bootLines.map((line, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="opacity-50">{`>`}</span>
                    <span className="typing-effect text-glass-accent">{line}</span>
                </div>
            ))}
            {bootLines.length === BOOT_LOGS.length && (
                 <div className="animate-pulse">_</div>
            )}
        </div>

        {/* MAIN CONTENT CENTER */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-screen-lg px-6 min-h-[50vh]">
            
            {/* --- PHASE 2: LOGO REVEAL --- */}
            <div className={`flex flex-col items-center transition-all duration-[3000ms] transform ${phase >= 2 ? 'scale-100 translate-y-0 opacity-100 blur-0' : 'scale-95 translate-y-10 opacity-0 blur-sm'}`}>
                
                {/* Ethereal Halo */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-[100px] transition-all duration-[4000ms] ${phase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}></div>

                {/* Cinematic Text */}
                <div className={`mt-12 text-center transition-all duration-[2000ms] delay-1000 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h1 className="text-4xl md:text-6xl font-extralight text-white tracking-[0.3em] mb-6 font-sans drop-shadow-lg">
                        RABELUS<span className="font-bold text-glass-accent">OS</span>
                    </h1>
                    <p className="text-xs text-glass-muted uppercase tracking-[0.5em] opacity-70">
                        Obsidian Genesis v3.0
                    </p>
                </div>
            </div>

            {/* --- PHASE 3: INTERACTION or WELCOME BACK --- */}
            <div className={`w-full max-w-md mt-20 transition-all duration-[1500ms] ${phase === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                
                {hasSession ? (
                    /* AUTO LOGIN VIEW */
                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-1000">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/20 mb-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <Cpu className="w-8 h-8 text-glass-accent animate-pulse" />
                        </div>
                        <h2 className="text-white text-xl font-light tracking-widest">
                            RETORNO AUTORIZADO: <span className="font-bold text-glass-accent">{savedName}</span>
                        </h2>
                        
                        <button 
                            onClick={handleAutoLogin}
                            className="mt-4 px-8 py-3 bg-glass-accent text-black font-bold uppercase tracking-widest text-xs rounded shadow-lg hover:scale-105 transition-transform"
                        >
                            Inicializar
                        </button>
                    </div>
                ) : (
                    /* NEW USER INPUT VIEW */
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 items-center">
                        <label className="text-[10px] font-bold text-glass-muted uppercase tracking-[0.3em] animate-pulse">
                            Credencial de Acesso
                        </label>
                        
                        <div className="relative w-full group">
                            <input 
                                ref={inputRef}
                                type="text" 
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Codinome"
                                className="w-full bg-transparent border-b border-white/20 text-center py-4 text-2xl font-light text-white placeholder:text-white/10 focus:outline-none focus:border-glass-accent transition-all font-mono tracking-wider"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="mt-6 flex items-center gap-3 px-10 py-3 border border-white/10 bg-white/5 hover:bg-glass-accent hover:text-black hover:border-glass-accent transition-all duration-500 rounded-sm uppercase text-xs font-bold tracking-[0.2em] group disabled:opacity-0 disabled:translate-y-4"
                        >
                            <span className="group-hover:animate-pulse">Acessar</span> <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                )}
            </div>
        </div>

        {/* LOADING PROGRESS BAR (Bottom) */}
        <div className="absolute bottom-10 left-10 right-10 flex flex-col gap-2">
            <div className={`h-[2px] bg-white/10 w-full overflow-hidden rounded-full transition-opacity duration-1000 ${phase > 0 ? 'opacity-100' : 'opacity-0'}`}>
                 <div className={`h-full bg-glass-accent shadow-[0_0_10px_var(--glass-accent)] transition-all ease-out duration-[12000ms] ${phase > 0 ? 'w-full' : 'w-0'}`}></div>
            </div>
            <div className="flex justify-between text-[9px] font-mono text-white/30 uppercase tracking-widest">
                 <span>Core: Stable</span>
                 <span className={`${phase >= 3 ? 'text-glass-accent' : 'animate-pulse'}`}>{phase >= 3 ? 'SYSTEM READY' : 'BOOTING...'}</span>
                 <span>Ver: 3.0.0</span>
            </div>
        </div>

        {/* Status Indicators (Top Right) */}
        <div className={`absolute top-10 right-10 flex gap-6 text-[9px] font-mono text-glass-accent uppercase tracking-widest transition-opacity duration-1000 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-2">
                <Wifi className="w-3 h-3 animate-pulse" /> NET: SECURE
            </div>
            <div className="flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> GUARD: ACTIVE
            </div>
        </div>
    </div>
  );
};