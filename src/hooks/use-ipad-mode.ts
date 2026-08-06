
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'rk_ipad_mode';
const CHANGE_EVENT = 'rk_ipad_mode_change';

export const getIpadMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
};

export const setIpadMode = (enabled: boolean) => {
  localStorage.setItem(STORAGE_KEY, String(enabled));
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export function useIpadMode() {
  const [enabled, setEnabled] = useState(getIpadMode);

  useEffect(() => {
    const handler = () => setEnabled(getIpadMode());
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, []);

  const toggle = useCallback(() => setIpadMode(!getIpadMode()), []);

  return { enabled, toggle };
}
