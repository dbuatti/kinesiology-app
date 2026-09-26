import { useEffect, useRef, useState } from "react";

/**
 * Eases a number up to its target (ease-out-expo, ~0.9s) the first time it
 * appears and whenever it changes. Non-numeric values pass straight through.
 * Respects prefers-reduced-motion.
 */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(target);
  const from = useRef(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target === from.current) {
      setValue(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    const decimals = Number.isInteger(target) ? 0 : 1;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const v = origin + (target - origin) * eased;
      setValue(Number(v.toFixed(decimals)));
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return value;
}

/** Drop-in component: <CountUp value={12} /> renders an animated number. */
export function CountUp({ value, format }: { value: number; format?: (n: number) => string }) {
  const v = useCountUp(value);
  return <>{format ? format(v) : v.toLocaleString()}</>;
}
