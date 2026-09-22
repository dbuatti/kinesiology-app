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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-border pt-3">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about scheduling, a client, or draft a reply..."
        rows={2}
        disabled={disabled}
        // 16px (text-base) is deliberate, not stylistic — anything smaller makes
        // iOS Safari auto-zoom the page on focus, per WebKit's documented behaviour.
        className="resize-none text-base md:text-sm"
      />
      <Button onClick={() => submit()} disabled={disabled || !value.trim()} size="icon" className="shrink-0">
        {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </div>
  );
}
