import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppMode = 'clinical' | 'lab' | 'library';
export type AppSubMode = 'default' | 'voice';

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  appMode: AppSubMode;
  setAppMode: (appMode: AppSubMode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

const STORAGE_KEY = 'antigravity_app_mode';
const SUB_STORAGE_KEY = 'antigravity_app_sub_mode';

export const ModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setModeState] = useState<AppMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as AppMode) || 'clinical';
  });

  const [appMode, setAppModeState] = useState<AppSubMode>(() => {
    const saved = localStorage.getItem(SUB_STORAGE_KEY);
    return (saved as AppSubMode) || 'default';
  });

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  const setAppMode = (newAppMode: AppSubMode) => {
    setAppModeState(newAppMode);
    localStorage.setItem(SUB_STORAGE_KEY, newAppMode);
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, appMode, setAppMode }}>
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