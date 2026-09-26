import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Resonance mark — a soft indigo tile with a centre point and two
 * concentric arcs radiating from it (a tone, resonating). Pure SVG so it
 * stays crisp at every size and in both themes.
 */
export function BrandMark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`bm-bg-${id}`} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="hsl(236 70% 66%)" />
          <stop offset="1" stopColor="hsl(242 58% 44%)" />
        </linearGradient>
        <linearGradient id={`bm-sheen-${id}`} x1="16" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="white" stopOpacity="0.28" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8.5" fill={`url(#bm-bg-${id})`} />
      <rect width="32" height="32" rx="8.5" fill={`url(#bm-sheen-${id})`} />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8" fill="none" stroke="white" strokeOpacity="0.16" />
      <circle cx="11" cy="16" r="2.4" fill="white" />
      <path d="M15.2 10.6a7 7 0 0 1 0 10.8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.92" />
      <path d="M19.4 7.2a11.6 11.6 0 0 1 0 17.6" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.55" />
    </svg>
  );
}

export default BrandMark;
