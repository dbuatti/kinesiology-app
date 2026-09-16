import { useEffect, useRef } from "react";
import { AssistantMessage, DraftEmail, PendingBooking } from "@/types/assistant";
import MessageBubble from "./MessageBubble";
import DraftEmailCard from "./DraftEmailCard";
import BookingProposalCard from "./BookingProposalCard";
import { Bot } from "lucide-react";

interface Props {
  messages: AssistantMessage[];
  isSending: boolean;
  pendingDraft: DraftEmail | null;
  onDraftSent: () => void;
  onDraftDiscard: () => void;
  pendingBooking: PendingBooking | null;
  onBookingConfirmed: () => void;
  onBookingDiscard: () => void;
}

export default function MessageList({
  messages, isSending, pendingDraft, onDraftSent, onDraftDiscard, pendingBooking, onBookingConfirmed, onBookingDiscard,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isSending, pendingDraft, pendingBooking]);

  if (messages.length === 0 && !isSending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground gap-3 py-16">
        <Bot className="h-10 w-10 opacity-40" />
        <p className="text-sm max-w-xs">
          Ask about a client's schedule, book them into a real slot, teach me their availability, or switch into focused mode to draft a reply in their style.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 space-y-4 overflow-y-auto px-1 py-4">
      {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
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
