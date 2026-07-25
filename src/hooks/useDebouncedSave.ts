import { useRef, useCallback, useEffect } from 'react';

export function useDebouncedSave(
  saveFn: (value: string) => void,
  delay: number = 1000
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValueRef = useRef<string>("");

  const save = useCallback((value: string) => {
    latestValueRef.current = value;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveFn(latestValueRef.current);
      timeoutRef.current = null;
    }, delay);
  }, [saveFn, delay]);

  const saveImmediate = useCallback((value: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    saveFn(value);
  }, [saveFn]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { save, saveImmediate };
}
