import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import ConversationList from "@/components/assistant/ConversationList";
import ClientPicker from "@/components/assistant/ClientPicker";
import MessageList from "@/components/assistant/MessageList";
import AssistantInput from "@/components/assistant/AssistantInput";
import NeedsAttentionWidget from "@/components/assistant/NeedsAttentionWidget";
import { AssistantConversation, AssistantMessage, DraftEmail, PendingBooking } from "@/types/assistant";
import { Bot, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClientOption {
  id: string;
  name: string;
}

export default function AssistantPage() {
  // Deep-link entry point, e.g. from the Needs Attention widget: /assistant?client=<id>&prompt=<text>
  const [searchParams] = useSearchParams();
  const initialClientId = searchParams.get("client");
  const initialPrompt = searchParams.get("prompt") || "";

  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [focusedClientId, setFocusedClientId] = useState<string | null>(initialClientId);
  const [isSending, setIsSending] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DraftEmail | null>(null);
  const [pendingDraftMessageId, setPendingDraftMessageId] = useState<string | null>(null);
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null);
  const [pendingBookingMessageId, setPendingBookingMessageId] = useState<string | null>(null);
  // Mobile shows one pane at a time — the conversation list, or the active chat.
  // A deep link with a client already chosen should land straight in the chat pane.
  const [mobileShowList, setMobileShowList] = useState(!initialClientId);

  const loadConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from("assistant_conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) { showError("Failed to load conversations."); return; }
    setConversations(data || []);
  }, []);

  const loadClients = useCallback(async () => {
    const { data, error } = await supabase.from("clients").select("id, name").order("name");
    if (!error) setClients(data || []);
  }, []);

  useEffect(() => {
    loadConversations();
    loadClients();
  }, [loadConversations, loadClients]);

  const loadMessages = useCallback(async (conversationId: string) => {
    const { data, error } = await supabase
      .from("assistant_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) { showError("Failed to load conversation history."); return; }
    setMessages(data || []);
    // Only the most recent message can carry a live draft/booking — an older
    // turn's is history (already resolved), never something to resurrect.
    const last = data?.[data.length - 1];
    setPendingDraft(last?.draft_email || null);
    setPendingDraftMessageId(last?.draft_email ? last.id : null);
    setPendingBooking(last?.pending_booking || null);
    setPendingBookingMessageId(last?.pending_booking ? last.id : null);
  }, []);

  const selectConversation = (id: string) => {
    setActiveId(id);
    const convo = conversations.find((c) => c.id === id);
    setFocusedClientId(convo?.client_id || null);
    loadMessages(id);
    setMobileShowList(false);
  };

  const startNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setPendingDraft(null);
    setPendingDraftMessageId(null);
    setPendingBooking(null);
    setPendingBookingMessageId(null);
    setMobileShowList(false);
  };

  const handleSend = async (text: string) => {
    setIsSending(true);
    // Optimistic local message so the UI feels responsive while the model runs.
    const optimisticId = `local-${Date.now()}`;
    setMessages((prev) => [...prev, { id: optimisticId, conversation_id: activeId || "", role: "user", content: text, created_at: new Date().toISOString() }]);

    try {
      const { data, error } = await supabase.functions.invoke("assistant-chat", {
        body: { conversation_id: activeId, client_id: focusedClientId, message: text },
      });
      if (error) throw error;

      setActiveId(data.conversation_id);
      setPendingDraft(data.draft_email || null);
      setPendingBooking(data.pending_booking || null);
      await Promise.all([loadMessages(data.conversation_id), loadConversations()]);
    } catch (err: any) {
      showError(err.message || "The assistant couldn't respond just then.");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setIsSending(false);
    }
  };

  // Resolving a draft/booking (sent, confirmed, or discarded) clears it in the
  // DB, not just local state — otherwise reloading the conversation, or
  // loadMessages running again after the next turn, would resurrect an
  // already-resolved one and risk it being sent/booked again.
  const clearPersistedDraft = async () => {
    if (pendingDraftMessageId) {
      await supabase.from("assistant_messages").update({ draft_email: null }).eq("id", pendingDraftMessageId);
    }
    setPendingDraft(null);
    setPendingDraftMessageId(null);
  };

  const clearPersistedBooking = async () => {
    if (pendingBookingMessageId) {
      await supabase.from("assistant_messages").update({ pending_booking: null }).eq("id", pendingBookingMessageId);
    }
    setPendingBooking(null);
    setPendingBookingMessageId(null);
  };

  const handleDraftSent = () => {
    clearPersistedDraft();
  };

  const handleDraftDiscard = () => {
    clearPersistedDraft();
  };

  const handleBookingConfirmed = () => {
    clearPersistedBooking();
  };

  const handleBookingDiscard = () => {
    clearPersistedBooking();
  };

  const clientNameFor = (clientId: string | null) => clients.find((c) => c.id === clientId)?.name || null;

  const activeClientName = clientNameFor(focusedClientId);

  return (
    <AppLayout variant="wide">
      <PageHeader
        icon={Bot}
        title="Assistant"
        subtitle="Ask about scheduling, past patterns, or switch into focused mode for a specific client."
        actions={<ClientPicker clients={clients} value={focusedClientId} onChange={setFocusedClientId} />}
      />
      <div className="mt-6">
        <NeedsAttentionWidget />
      </div>
      <div
        className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-0 rounded-2xl border border-border overflow-hidden bg-card"
        style={{ height: "calc(100vh - 300px)", minHeight: 420 }}
      >
        <div className={cn("min-h-0", mobileShowList ? "flex" : "hidden", "md:flex")}>
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={selectConversation}
            onNew={startNewChat}
            clientNameFor={clientNameFor}
          />
        </div>
        <div className={cn("flex-col p-4 min-w-0 min-h-0", mobileShowList ? "hidden" : "flex", "md:flex")}>
          {/* Mobile-only: back to the conversation list instead of stacking both panes full-height. */}
          <div className="flex items-center gap-2 pb-3 md:hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setMobileShowList(true)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold text-foreground truncate">{activeClientName || "General"}</span>
          </div>
          <MessageList
            messages={messages}
            isSending={isSending}
            pendingDraft={pendingDraft}
            onDraftSent={handleDraftSent}
            onDraftDiscard={handleDraftDiscard}
            pendingBooking={pendingBooking}
            onBookingConfirmed={handleBookingConfirmed}
            onBookingDiscard={handleBookingDiscard}
          />
          <AssistantInput onSend={handleSend} disabled={isSending} initialValue={initialPrompt} />
        </div>
      </div>
    </AppLayout>
  );
}
