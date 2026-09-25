import { useState, useEffect, useRef, useLayoutEffect, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
  initialValue?: string;
  // True once a deep-linked quick action's client/voice-student target has
  // actually resolved — see AssistantPage.tsx's autoSendReady.
  autoSend?: boolean;
  /** Tap-to-fill starters shown under the field (context-aware from the page). */
  suggestions?: string[];
  placeholder?: string;
}

export default function AssistantInput({ onSend, disabled, initialValue, autoSend, suggestions, placeholder }: Props) {
  const [value, setValue] = useState(initialValue || "");
  const autoSentRef = useRef(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = (override?: string) => {
    const trimmed = (override ?? value).trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  // A deep-linked quick action (Follow-up's "Book") is already a complete
  // instruction the practitioner chose — send it once the parent confirms the
  // target has resolved (autoSend flips true), not on mount.
  useEffect(() => {
    if (autoSend && initialValue && !autoSentRef.current && !disabled) {
      autoSentRef.current = true;
      submit(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSend, disabled]);

  // Auto-grow: the field hugs its content up to ~8 lines, then scrolls.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't submit mid-IME-composition (JP/CN keyboards).
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = !disabled && !!value.trim();

  return (
    <div className="flex flex-col gap-2 pt-3">
      <div
        className={cn(
          "rounded-2xl border border-border bg-card shadow-sm transition-[border-color,box-shadow] duration-200",
          "focus-within:border-ring/50 focus-within:shadow-[0_0_0_4px_hsl(var(--ring)/0.10),0_8px_24px_-12px_hsl(var(--shadow-color)/0.2)]"
        )}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Ask about scheduling, a client, or draft a reply…"}
          rows={1}
          disabled={disabled}
          // 16px on phones stops iOS Safari zooming the page on focus.
          className="block max-h-[200px] min-h-[52px] w-full resize-none bg-transparent px-4 pb-1 pt-3.5 text-base leading-relaxed outline-none placeholder:text-muted-foreground/70 md:text-[14.5px]"
        />
        <div className="flex items-center gap-2 px-2.5 pb-2.5">
          <span className="hidden text-[11px] text-muted-foreground/70 md:inline">
            <kbd className="kbd">↵</kbd> send · <kbd className="kbd">⇧</kbd><kbd className="kbd">↵</kbd> new line
          </span>
          <Button
            onClick={() => submit()}
            disabled={!canSend}
            size="icon"
            className={cn("ml-auto h-8 w-8 rounded-full transition-transform", canSend && "scale-100", !canSend && "opacity-40")}
            aria-label="Send message"
          >
            {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" strokeWidth={2.5} />}
          </Button>
        </div>
      </div>
      {suggestions && suggestions.length > 0 && !value && !disabled && (
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => { setValue(s); ref.current?.focus(); }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12.5px] text-muted-foreground shadow-xs transition-colors hover:border-primary/30 hover:text-foreground"
            >
              <Sparkles className="h-3 w-3 text-primary/70" /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
