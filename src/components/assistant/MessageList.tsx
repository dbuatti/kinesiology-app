import { useEffect, useRef } from "react";
import { AssistantMessage, DraftEmail, PendingBooking } from "@/types/assistant";
import MessageBubble from "./MessageBubble";
import DraftEmailCard from "./DraftEmailCard";
import BookingProposalCard from "./BookingProposalCard";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, RotateCcw } from "lucide-react";

interface Props {
  messages: AssistantMessage[];
  isSending: boolean;
  pendingDraft: DraftEmail | null;
  onDraftSent: () => void;
  onDraftDiscard: () => void;
  pendingBooking: PendingBooking | null;
  onBookingConfirmed: () => void;
  onBookingDiscard: () => void;
  onSuggestion: (text: string) => void;
  onRetry?: (id: string, text: string) => void;
}

const STARTER_PROMPT = "What should I work on today?";

export default function MessageList({
  messages, isSending, pendingDraft, onDraftSent, onDraftDiscard, pendingBooking, onBookingConfirmed, onBookingDiscard, onSuggestion, onRetry,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Deliberately depends only on messages.length (a genuinely new turn) — NOT on
  // pendingDraft/pendingBooking object identity. Those null out on every Discard/
  // Send click (see AssistantPage's clearPersistedDraft/Booking), which used to
  // re-trigger this smooth scroll on every button click with no new message —
  // the exact "scrolls me down when I click a button" bug reported on iPad.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isSending]);

  if (messages.length === 0 && !isSending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground gap-3 py-16">
        <Bot className="h-10 w-10 opacity-40" />
        <p className="text-sm max-w-xs">
          Ask about a client's schedule, book them into a real slot, teach me their availability, or switch into focused mode to draft a reply in their style.
        </p>
        <button
          onClick={() => onSuggestion(STARTER_PROMPT)}
          className="flex items-center gap-1.5 rounded-full border border-chart-primary/30 bg-chart-primary/5 px-3.5 py-2 text-xs font-semibold text-chart-primary hover:bg-chart-primary/10 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" /> {STARTER_PROMPT}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 space-y-4 overflow-y-auto px-1 py-4">
      {messages.map((m) => (
        <div key={m.id}>
          <MessageBubble message={m} />
          {m.failed && (
            <div className="flex items-center gap-2 ml-11 mt-1">
              <span className="text-[11px] text-chart-destructive">Couldn't send.</span>
              <Button
                size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1"
                onClick={() => onRetry?.(m.id, m.content || "")}
              >
                <RotateCcw className="h-3 w-3" /> Retry
              </Button>
            </div>
          )}
        </div>
      ))}
      {pendingDraft && (
        <div className="max-w-[85%] mr-auto">
          <DraftEmailCard draft={pendingDraft} onSent={onDraftSent} onDiscard={onDraftDiscard} />
        </div>
      )}
      {pendingBooking && (
        <div className="max-w-[85%] mr-auto">
          <BookingProposalCard booking={pendingBooking} onConfirmed={onBookingConfirmed} onDiscard={onBookingDiscard} />
        </div>
      )}
      {isSending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground pl-11">
          <span className="h-2 w-2 rounded-full bg-chart-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-chart-primary animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-chart-primary animate-bounce" />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
