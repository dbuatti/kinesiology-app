import { cn } from "@/lib/utils";

/** The four-point star from the Resonance Kinesiology logo. Inherits `currentColor`. */
export function BrandStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="currentColor" aria-hidden="true">
      <path d="M12 1.5c.55 5.9 4.6 9.95 10.5 10.5-5.9.55-9.95 4.6-10.5 10.5-.55-5.9-4.6-9.95-10.5-10.5C7.4 11.45 11.45 7.4 12 1.5Z" />
    </svg>
  );
}

/**
 * Resonance Kinesiology logo — star + serif wordmark in brand navy.
 * Size it with a text size on `className`; the star scales with the type.
 */
export function BrandLogo({ className, wordmark = "Resonance Kinesiology" }: { className?: string; wordmark?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.4em] text-brand", className)}>
      <BrandStar className="h-[0.85em] w-[0.85em] shrink-0" />
      <span className="font-serif font-normal leading-none tracking-[-0.005em]">{wordmark}</span>
    </span>
  );
}

export default BrandLogo;
