"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppMode = 'clinical' | 'lab' | 'library';

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

const STORAGE_KEY = 'antigravity_app_mode';

export const ModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setModeState] = useState<AppMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as AppMode) || 'clinical';
  });

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
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