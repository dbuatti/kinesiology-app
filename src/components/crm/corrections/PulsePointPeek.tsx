import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Hover/tap peek at the wrist pulse photograph.
 *
 * Pulse positions are the one part of the organ workflow that people re-learn
 * by looking — "left chi" only means something once you can see where it sits.
 * So the words themselves carry the picture: hover on a pointer device, tap or
 * keyboard-focus on an iPad. Rendered in a portal so the dock's scroll area
 * can never clip it.
 */
export const PulsePointPeek = ({
  pulse,
  children,
  className,
}: {
  /** e.g. "Left chi" — used as the caption and the accessible name. */
  pulse: string;
  children?: ReactNode;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  // A short grace period on the way out: moving the pointer from the word onto
  // the picture (to look closer) shouldn't make it vanish mid-journey.
  const clearClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const show = () => {
    clearClose();
    setOpen(true);
  };
  const hideSoon = () => {
    clearClose();
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      setOpen(false);
    }, 160);
  };

  useEffect(() => clearClose, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={show}
          onMouseLeave={hideSoon}
          aria-label={`Show pulse point for ${pulse}`}
          className={cn(
            "cursor-help rounded-sm text-left underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25",
            className
          )}
        >
          {children ?? pulse}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={8}
        collisionPadding={8}
        className="w-[min(92vw,26rem)] p-2"
        onMouseEnter={show}
        onMouseLeave={hideSoon}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <img
          src="/images/pulse-points.png"
          alt={`Pulse point positions on the wrist — ${pulse}`}
          width={640}
          height={420}
          loading="lazy"
          decoding="async"
          className="w-full rounded-lg border border-border bg-white object-contain"
        />
        <span className="mt-2 flex items-baseline justify-between gap-2 px-1 pb-0.5">
          <span className="text-[12px] font-bold text-foreground">{pulse}</span>
          <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
            Pulse point
          </span>
        </span>
      </PopoverContent>
    </Popover>
  );
};

/**
 * Splits a caption like `"Water · Kidney / Bladder · Left chi"` and turns the
 * trailing pulse into a peek. Anything that doesn't end in a known pulse
 * position is returned untouched, so the caption stays the source of truth.
 */
const PULSE_TOKEN = /^(Left|Right) (cun|guan|chi)$/i;

export const CaptionWithPulse = ({ caption }: { caption: string }) => {
  const parts = caption.split(" · ");
  const last = parts[parts.length - 1];
  if (parts.length < 2 || !PULSE_TOKEN.test(last?.trim() ?? "")) {
    return <>{caption}</>;
  }
  const head = parts.slice(0, -1).join(" · ");
  return (
    <>
      {head}
      {" · "}
      <PulsePointPeek pulse={last.trim()} />
    </>
  );
};

export default PulsePointPeek;
