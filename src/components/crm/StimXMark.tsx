import { cn } from "@/lib/utils";

export const StimXMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={cn("block", className)} aria-hidden="true">
    <g stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round">
      <path d="M3.5 3.5 C6.5 5.5, 9.5 10.5, 12.5 12.5" />
      <path d="M12.5 3.5 C9.5 10.5, 6.5 5.5, 3.5 12.5" />
    </g>
  </svg>
);
