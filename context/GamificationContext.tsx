import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Títulos baseados em nível - Rabelus Rebrand
const RANKS = [
  { minLevel: 50, title: 'Lead Visionary', icon: '🚀' },
  { minLevel: 10, title: 'Architect', icon: '🏗️' },
  { minLevel: 5, title: 'Lab Partner', icon: '🧪' },
  { minLevel: 1, title: 'Builder', icon: '🛠️' },
];

interface Quest {
  id: string;
  label: string;
  xpReward: number;
  completed: boolean;
}

interface GamificationState {
  username: string; 
  hasOnboarded: boolean; // Flag de sessão
  xp: number;
  level: number;
  coins: number;
  streak: number;
  rankTitle: string;
  rankIcon: string;
  completedQuests: string[]; 
}

interface GamificationContextType extends GamificationState {
  setUsername: (name: string) => void;
  completeOnboarding: (name: string) => void; // Finaliza o splash
  logout: () => void; // Trocar usuário
  addXp: (amount: number) => void;
  addCoins: (amount: number) => void;
  completeQuest: (questId: string, xpReward: number) => void;
  xpToNextLevel: number;
  progressPercent: number;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

const XP_PER_LEVEL = 1000;
const STORAGE_KEY = 'rabelus_loyalty_v1';

const INITIAL_STATE: GamificationState = {
  username: '',
  hasOnboarded: false,
  xp: 0,
  level: 1,
  coins: 0,
  streak: 1,
  rankTitle: 'Builder',
  rankIcon: '🛠️',
  completedQuests: []
};

export const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GamificationState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);

  // Load from Storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load gamification data");
      }
    }
    setLoaded(true);
  }, []);

  // Save to Storage
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, loaded]);

  const setUsername = (name: string) => {
    setState(prev => ({ ...prev, username: name }));
  };

  const completeOnboarding = (name: string) => {
      setState(prev => ({ ...prev, username: name, hasOnboarded: true }));
  };

  const logout = () => {
      const newState = { ...state, hasOnboarded: false };
      setState(newState);
      // Force sync save before reload to ensure splash screen shows
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      // Use setTimeout to allow React to finish any pending updates if necessary, though synchronous setItem handles storage
      window.location.reload(); 
  };

  const getRank = (lvl: number) => {
    return RANKS.find(r => lvl >= r.minLevel) || RANKS[RANKS.length - 1];
  };

  const addXp = (amount: number) => {
    setState(prev => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      
      // Level Up Logic
      if (newXp >= XP_PER_LEVEL) {
        newXp = newXp - XP_PER_LEVEL;
        newLevel += 1;
      }

      const rank = getRank(newLevel);

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        rankTitle: rank.title,
        rankIcon: rank.icon
      };
    });
  };

  const addCoins = (amount: number) => {
    setState(prev => ({ ...prev, coins: prev.coins + amount }));
  };

  const completeQuest = (questId: string, xpReward: number) => {
    if (state.completedQuests.includes(questId)) return;
    
    addXp(xpReward);
    addCoins(10); 
    setState(prev => ({
        ...prev,
        completedQuests: [...prev.completedQuests, questId]
    }));
  };

  const xpToNextLevel = XP_PER_LEVEL - state.xp;
  const progressPercent = (state.xp / XP_PER_LEVEL) * 100;

  return (
    <GamificationContext.Provider value={{ 
      ...state, 
      setUsername,
      completeOnboarding,
      logout,
      addXp, 
      addCoins, 
      completeQuest, 
      xpToNextLevel, 
      progressPercent 
    }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};