
import { createContext, useContext, useState } from 'react'; import type { ReactNode } from 'react';
import { normaliseZone, type Zone } from '@/lib/zones';

// The active zone (Practice / Business / Growth). See src/lib/zones.ts.
export type AppMode = Zone;

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

const STORAGE_KEY = 'rk_app_mode';

export const ModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<AppMode>(() => {
    try { return normaliseZone(localStorage.getItem(STORAGE_KEY)); } catch { return 'practice'; }
  });

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    try { localStorage.setItem(STORAGE_KEY, newMode); } catch { /* private mode */ }
  };

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useAppMode = () => {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useAppMode must be used within a ModeProvider');
  }
  return context;
};
