import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
  initialValue?: string;
  // True once a deep-linked quick action's client/voice-student target has
  // actually resolved — see AssistantPage.tsx's autoSendReady.
  autoSend?: boolean;
}

export default function AssistantInput({ onSend, disabled, initialValue, autoSend }: Props) {
  const [value, setValue] = useState(initialValue || "");
  const autoSentRef = useRef(false);

  const submit = (override?: string) => {
    const trimmed = (override ?? value).trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  // A deep-linked quick action (Follow-up's "Book" — "Find a good slot and
  // book Bella's next session...") is already a complete instruction the
  // practitioner chose by clicking it; making him also click Send on a
  // message he wasn't going to edit was pure friction ("really ensure I can
  // get from virtual assistant to booking someone in relatively quickly").
  // Fires once the parent confirms the deep-linked target has actually
  // resolved (autoSend flips true) — not on mount, since sending before then
  // would go out as an unfocused general message instead of against the
  // intended client.
  useEffect(() => {
    if (autoSend && initialValue && !autoSentRef.current && !disabled) {
      autoSentRef.current = true;
      submit(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSend, disabled]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't submit mid-IME-composition (JP/CN keyboards) — Enter there confirms
    // the composition instead of sending an unfinished message.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex flex-col gap-1.5 border-t border-border pt-3">
      {/* Anchored composer as a single rounded surface (input + send fused) so it
          reads as one premium control instead of a box with a detached button. */}
      <div className="flex items-end gap-1.5 rounded-2xl border border-border bg-card p-1.5 shadow-sm transition-shadow focus-within:border-primary/40 focus-within:shadow-md">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about scheduling, a client, or draft a reply..."
          rows={2}
          disabled={disabled}
          // 16px (text-base) is deliberate, not stylistic — anything smaller makes
          // iOS Safari auto-zoom the page on focus, per WebKit's documented behaviour.
          // min-h-0/max-h-40 override the primitive's built-in 80px minimum so a
          // short field stays short and grows naturally; focus rings live on the
          // wrapper above, not on the naked textarea inside it.
          className="min-h-0 max-h-40 resize-none border-0 bg-transparent px-3 py-2.5 text-base shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-sm"
        />
        <Button onClick={() => submit()} disabled={disabled || !value.trim()} size="icon" className="h-9 w-9 shrink-0 rounded-xl" aria-label="Send message">
          {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <p className="hidden md:flex justify-end pr-1.5 text-[10px] text-muted-foreground/70 select-none">
        Enter to send · Shift+Enter for a new line
      </p>
    </div>
  );
}
