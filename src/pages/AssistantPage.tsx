import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link as RouterLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import ConversationList from "@/components/assistant/ConversationList";
import ClientPicker from "@/components/assistant/ClientPicker";
import { voiceStudentIdFor, emailFromVoiceStudentId, isVoiceStudentId } from "@/lib/voice-student-id";
import MessageList from "@/components/assistant/MessageList";
import AssistantInput from "@/components/assistant/AssistantInput";
import NeedsAttentionWidget from "@/components/assistant/NeedsAttentionWidget";
import ClientEmailThread from "@/components/assistant/ClientEmailThread";
import CommsInbox from "@/components/assistant/CommsInbox";
import { AssistantConversation, AssistantMessage, DraftEmail, PendingBooking, VoiceStudentOption } from "@/types/assistant";
import { Bot, ChevronLeft, MessageCircle, Mail, CalendarRange, Anchor, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClientOption {
  id: string;
  name: string;
  email: string | null;
}

export default function AssistantPage() {
  // Deep-link entry point, e.g. from the Needs Attention widget: /assistant?client=<id>&prompt=<text>
  const [searchParams] = useSearchParams();
  const initialClientId = searchParams.get("client");
  const initialPrompt = searchParams.get("prompt") || "";
  const initialView = searchParams.get("view") === "email" ? "email" : "chat";

  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [voiceStudents, setVoiceStudents] = useState<VoiceStudentOption[]>([]);
  const [focusedClientId, setFocusedClientId] = useState<string | null>(initialClientId);
  const [isSending, setIsSending] = useState(false);
  // Anchor Mode: the assistant prioritises long, consistent clients (get_anchor_candidates)
  // over ad-hoc scheduling — for deliberately filling the week around reliable bookings first.
  const [anchorMode, setAnchorMode] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DraftEmail | null>(null);
  const [pendingDraftMessageId, setPendingDraftMessageId] = useState<string | null>(null);
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null);
  const [pendingBookingMessageId, setPendingBookingMessageId] = useState<string | null>(null);
  // Mobile shows one pane at a time — the conversation list, or the active chat.
  // A deep link with a client already chosen should land straight in the chat pane.
  const [mobileShowList, setMobileShowList] = useState(!initialClientId);
  // Only meaningful in focused mode: the AI chat, or the client's real email thread.
  const [viewMode, setViewMode] = useState<"chat" | "email" | "inbox">(initialView);

  // Voice students use a "voice:<email>" pseudo-id (see ClientPicker) since they
  // aren't rows in `clients` — resolve it back to the real student wherever focus matters.
  const focusedVoiceStudent = focusedClientId && isVoiceStudentId(focusedClientId)
    ? voiceStudents.find((s) => s.email.toLowerCase() === emailFromVoiceStudentId(focusedClientId).toLowerCase()) || null
    : null;

  const loadConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from("assistant_conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) { showError("Failed to load conversations."); return; }
    setConversations(data || []);
  }, []);

  const loadClients = useCallback(async () => {
    const { data, error } = await supabase.from("clients").select("id, name, email").order("name");
    if (!error) setClients(data || []);
  }, []);

  const loadVoiceStudents = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("voice-clients");
    if (error || !data?.success) return;
    const rawStudents = (data.students || []) as { archived: boolean; name: string | null; email: string | null }[];
    const students = rawStudents
      .filter((s) => !s.archived && s.name && s.email)
      .map((s) => ({ name: s.name as string, email: s.email as string }))
      .sort((a, b) => a.name.localeCompare(b.name));
    setVoiceStudents(students);
  }, []);

  useEffect(() => {
    loadConversations();
    loadClients();
    loadVoiceStudents();
  }, [loadConversations, loadClients, loadVoiceStudents]);

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
    setFocusedClientId(convo?.client_id || (convo?.voice_student_email ? voiceStudentIdFor(convo.voice_student_email) : null));
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
        body: {
          conversation_id: activeId,
          client_id: focusedVoiceStudent ? null : focusedClientId,
          voice_student_email: focusedVoiceStudent?.email || null,
          voice_student_name: focusedVoiceStudent?.name || null,
          message: text,
          anchor_mode: anchorMode,
        },
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

  const copyChatToClipboard = async () => {
    const text = messages
      .map((m) => `${m.role === "user" ? "You" : "Assistant"}: ${m.content || ""}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      showSuccess("Chat copied to clipboard.");
    } catch {
      showError("Couldn't copy — your browser may be blocking clipboard access.");
    }
  };

  const clientNameFor = (clientId: string | null) => clients.find((c) => c.id === clientId)?.name || null;
  const focusedClient = focusedVoiceStudent
    ? { id: focusedClientId as string, name: focusedVoiceStudent.name, email: focusedVoiceStudent.email }
    : clients.find((c) => c.id === focusedClientId) || null;

  const activeClientName = focusedVoiceStudent?.name || clientNameFor(focusedClientId);

  return (
    <AppLayout variant="wide">
      <PageHeader
        icon={Bot}
        title="Assistant"
        subtitle="Ask about scheduling, past patterns, or switch into focused mode for a specific client."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "inbox" ? "default" : "outline"}
              size="sm"
              className={cn("h-9 text-xs gap-1.5", viewMode === "inbox" && "bg-chart-primary hover:bg-chart-primary/90 text-white")}
              onClick={() => { setViewMode((v) => (v === "inbox" ? "chat" : "inbox")); setMobileShowList(false); }}
              title="Every recent client email, across everyone, newest first"
            >
              <Mail className="h-3.5 w-3.5" /> Inbox
            </Button>
            <Button
              variant={anchorMode ? "default" : "outline"}
              size="sm"
              className={cn("h-9 text-xs gap-1.5", anchorMode && "bg-chart-emerald hover:bg-chart-emerald/90 text-white")}
              onClick={() => setAnchorMode((v) => !v)}
              title="Prioritise long, consistent clients first when filling the week"
            >
              <Anchor className="h-3.5 w-3.5" /> Anchor Mode
            </Button>
            <Button asChild variant="outline" size="sm" className="h-9 text-xs gap-1.5">
              <RouterLink to="/timetable"><CalendarRange className="h-3.5 w-3.5" /> Timetable Simulator</RouterLink>
            </Button>
            <ClientPicker clients={clients} voiceStudents={voiceStudents} value={focusedClientId} onChange={setFocusedClientId} />
          </div>
        }
      />
      <div className="mt-6">
        <NeedsAttentionWidget />
      </div>
      <div
        className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-0 rounded-2xl border border-border overflow-hidden bg-card"
        style={{ height: "calc(100vh - 300px)", minHeight: 420 }}
      >
        <div className={cn("min-h-0 min-w-0", mobileShowList ? "flex" : "hidden", "md:flex")}>
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
            <span className="text-sm font-semibold text-foreground truncate flex-1">{activeClientName || "General"}</span>
            {messages.length > 0 && viewMode === "chat" && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copyChatToClipboard} title="Copy chat to clipboard">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {messages.length > 0 && viewMode === "chat" && (
            <div className="hidden md:flex justify-end mb-2">
              <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" onClick={copyChatToClipboard}>
                <Copy className="h-3 w-3" /> Copy chat
              </Button>
            </div>
          )}
          {focusedClient && viewMode !== "inbox" && (
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg mb-3 w-fit">
              <button
                onClick={() => setViewMode("chat")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors", viewMode === "chat" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <MessageCircle className="h-3.5 w-3.5" /> AI Chat
              </button>
              <button
                onClick={() => setViewMode("email")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors", viewMode === "email" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <Mail className="h-3.5 w-3.5" /> Email Thread
              </button>
            </div>
          )}
          {viewMode === "inbox" ? (
            <CommsInbox
              onOpenClient={(id) => {
                setFocusedClientId(id);
                setViewMode("email");
              }}
            />
          ) : viewMode === "email" && focusedClient ? (
            <ClientEmailThread clientId={focusedClient.id} clientEmail={focusedClient.email} clientName={focusedClient.name} />
          ) : (
            <>
              <MessageList
                messages={messages}
                isSending={isSending}
                pendingDraft={pendingDraft}
                onDraftSent={handleDraftSent}
                onDraftDiscard={handleDraftDiscard}
                pendingBooking={pendingBooking}
                onBookingConfirmed={handleBookingConfirmed}
                onBookingDiscard={handleBookingDiscard}
                onSuggestion={handleSend}
              />
              <AssistantInput onSend={handleSend} disabled={isSending} initialValue={initialPrompt} />
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
