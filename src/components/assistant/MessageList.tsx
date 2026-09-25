import { BrandMark } from "@/components/layout/BrandMark";
import { useEffect, useRef } from "react";
import { AssistantMessage, DraftEmail, PendingBooking } from "@/types/assistant";
import MessageBubble from "./MessageBubble";
import DraftEmailCard from "./DraftEmailCard";
import BookingProposalCard from "./BookingProposalCard";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, RotateCcw, Loader2 } from "lucide-react";

interface Props {
  messages: AssistantMessage[];
  isSending: boolean;
  // Reply text streamed in live from the edge function (SSE deltas). While
  // populated it renders as a growing assistant bubble; the authoritative copy
  // lands in assistant_messages once the stream finishes.
  streamingContent?: string | null;
  // Live status line ("Checking real availability…") shown under the reply.
  streamingStatus?: string | null;
  pendingDraft: DraftEmail | null;
  onDraftSent: () => void;
  onDraftDiscard: () => void;
  pendingBooking: PendingBooking | null;
  onBookingConfirmed: () => void;
  onBookingDiscard: () => void;
  onSuggestion: (text: string) => void;
  onRetry?: (id: string, text: string) => void;
  /** Empty-state starters; defaults to general practice prompts. */
  prompts?: { label: string; prompt: string }[];
  heroTitle?: string;
  heroSubtitle?: string;
}

const STARTER_PROMPT = "What should I work on today?";

const QUICK_PROMPTS: { label: string; prompt: string }[] = [
  { label: STARTER_PROMPT, prompt: STARTER_PROMPT },
  { label: "Who needs follow-up?", prompt: "Who needs follow-up this week?" },
  { label: "How's my booking load?", prompt: "How is my booking load looking this week?" },
];

export default function MessageList({
  messages, isSending, streamingContent, streamingStatus, pendingDraft, onDraftSent, onDraftDiscard, pendingBooking, onBookingConfirmed, onBookingDiscard, onSuggestion, onRetry, prompts, heroTitle, heroSubtitle,
}: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Deliberately depends only on messages.length (a genuinely new turn) — NOT on
  // pendingDraft/pendingBooking object identity. Those null out on every Discard/
  // Send click (see AssistantPage's clearPersistedDraft/Booking), which used to
  // re-trigger this scroll on every button click with no new message — the exact
  // "scrolls me down when I click a button" bug reported on iPad.
  //
  // Sets scrollTop directly on this pane's own container instead of calling
  // bottomRef.scrollIntoView() — scrollIntoView walks up and scrolls EVERY
  // scrollable ancestor needed to bring the target into view, including the
  // outer page (dragging it toward the footer below), which is almost
  // certainly what was actually behind "I'm pushed down" — not just this
  // pane's own list, the whole page moved. Setting scrollTop confines the
  // scroll to this one pane and never touches the page's own scroll position.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, isSending, streamingContent?.length]);

  const hasStreaming = !!streamingContent && streamingContent.trim() !== "";

  if (messages.length === 0 && !isSending && !hasStreaming) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto py-8 text-center sm:py-16">
        <div className="relative">
          <div aria-hidden className="absolute inset-0 -m-6 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.18),transparent)] animate-pulse-soft" />
          <BrandMark className="relative h-12 w-12 rounded-[14px] shadow-lg shadow-primary/20" />
        </div>
        <div className="space-y-1.5">
          <p className="font-serif text-2xl font-medium tracking-[-0.02em] text-foreground">{heroTitle ?? "Your practice, at your fingertips"}</p>
          <p className="mx-auto text-sm text-muted-foreground max-w-sm">
            {heroSubtitle ?? "Ask about a client's schedule, book them into a real slot, or draft a reply in their style."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {(prompts ?? QUICK_PROMPTS).map((q, qi) => (
            <button
              key={q.label}
              onClick={() => onSuggestion(q.prompt)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-[13px] font-medium text-foreground shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-primary/30 hover:shadow-sm"
            >
              {(q.label === STARTER_PROMPT || (prompts && qi === 0)) && <Sparkles className="h-3.5 w-3.5 text-primary" />}
              {q.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} className="flex-1 min-h-0 space-y-4 overflow-y-auto px-1 py-4">
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
        <div className="max-w-[min(85%,42rem)] mr-auto">
          <DraftEmailCard draft={pendingDraft} onSent={onDraftSent} onDiscard={onDraftDiscard} />
        </div>
      )}
      {pendingBooking && (
        <div className="max-w-[min(85%,42rem)] mr-auto">
          <BookingProposalCard booking={pendingBooking} onConfirmed={onBookingConfirmed} onDiscard={onBookingDiscard} />
        </div>
      )}
      {(isSending || hasStreaming) && (
        // Renders inside the same rounded, elevated bubble as a real assistant
        // message so the in-flight state reads as one of its replies, not a
        // stray row of dots floating off to the side. Once the reply text is
        // actually streaming, that text replaces the dots and grows in place.
        <div className="pl-11">
          {hasStreaming ? (
            <MessageBubble message={{
              id: "streaming",
              conversation_id: "",
              role: "model",
              content: streamingContent || "",
              created_at: new Date().toISOString(),
            }} />
          ) : (
            <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border/70 bg-card px-4 py-3 shadow-sm animate-in fade-in duration-150">
              <span className="h-1.5 w-1.5 rounded-full bg-chart-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-chart-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-chart-primary animate-bounce" />
            </div>
          )}
          {(streamingStatus || (isSending && !hasStreaming)) && (
            <p className="mt-1.5 flex items-center gap-1.5 pl-1 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {streamingStatus || "Thinking…"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
