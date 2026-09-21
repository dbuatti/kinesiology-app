import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { useSearchParams, Link as RouterLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useAssistantConversation } from "@/hooks/useAssistantConversation";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ConversationList from "@/components/assistant/ConversationList";
import ClientPicker from "@/components/assistant/ClientPicker";
import { voiceStudentIdFor, emailFromVoiceStudentId, isVoiceStudentId } from "@/lib/voice-student-id";
import MessageList from "@/components/assistant/MessageList";
import AssistantInput from "@/components/assistant/AssistantInput";
import KeyMetricsBar from "@/components/assistant/KeyMetricsBar";
import NeedsAttentionWidget from "@/components/assistant/NeedsAttentionWidget";
import FollowUpTab from "@/components/assistant/FollowUpTab";
import LaunchCampaignTab from "@/components/assistant/LaunchCampaignTab";
import ClientEmailThread from "@/components/assistant/ClientEmailThread";
import CommsInbox from "@/components/assistant/CommsInbox";
import ClientSnapshotPanel from "@/components/assistant/ClientSnapshotPanel";
import { VoiceStudentOption } from "@/types/assistant";
import { Bot, ChevronLeft, ChevronUp, ChevronDown, MessageCircle, Mail, AlertCircle, CalendarRange, ArrowUpRight, Copy, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AssistantTab = "chat" | "followup" | "inbox" | "launch";

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
  const viewParam = searchParams.get("view");
  const initialView = viewParam === "email" ? "email" : "chat";

  const [activeTab, setActiveTab] = useState<AssistantTab>(viewParam === "inbox" ? "inbox" : "chat");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [voiceStudents, setVoiceStudents] = useState<VoiceStudentOption[]>([]);
  const [focusedClientId, setFocusedClientId] = useState<string | null>(initialClientId);
  // Mobile shows one pane at a time — the conversation list, or the active chat.
  // A deep link with a client already chosen should land straight in the chat pane.
  const [mobileShowList, setMobileShowList] = useState(!initialClientId);
  // Remembered per-browser (not per-account — a per-viewer convenience, same
  // as any localStorage UI preference) so collapsing it once sticks across
  // visits instead of resetting every reload.
  const [metricsCollapsed, setMetricsCollapsed] = useState(() => {
    try { return localStorage.getItem("assistant_metrics_collapsed") === "1"; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("assistant_metrics_collapsed", metricsCollapsed ? "1" : "0"); } catch { /* ignore */ }
  }, [metricsCollapsed]);
  // Only meaningful in focused mode, within the Chat tab: the AI chat, or the
  // client's real email thread. Inbox is now a sibling top-level tab (activeTab),
  // not a third value here.
  const [viewMode, setViewMode] = useState<"chat" | "email">(initialView);

  // Size the two-pane grid to exactly fill the remaining viewport instead of a
  // fixed "calc(100vh - 300px)" guess — that guess broke (outer page grew a
  // second scrollbar alongside the conversation-list/message-list ones) whenever
  // NeedsAttentionWidget rendered a non-trivial number of cards above it.
  const aboveGridRef = useRef<HTMLDivElement>(null);
  const [gridHeight, setGridHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = aboveGridRef.current;
    if (!el) return;
    const recompute = () => {
      const top = el.getBoundingClientRect().bottom;
      setGridHeight(Math.max(420, window.innerHeight - top - 32));
    };
    recompute();
    window.addEventListener("resize", recompute);
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => { window.removeEventListener("resize", recompute); ro.disconnect(); };
  }, []);

  // Voice students use a "voice:<email>" pseudo-id (see ClientPicker) since they
  // aren't rows in `clients` — resolve it back to the real student wherever focus matters.
  const focusedVoiceStudent = focusedClientId && isVoiceStudentId(focusedClientId)
    ? voiceStudents.find((s) => s.email.toLowerCase() === emailFromVoiceStudentId(focusedClientId).toLowerCase()) || null
    : null;

  const {
    conversations, activeId, messages, isSending, pendingDraft, pendingBooking,
    loadConversations, selectConversation: selectConversationBase, startNewChat: startNewChatBase, handleSend,
    handleDraftSent, handleDraftDiscard, handleBookingConfirmed, handleBookingDiscard, deleteConversation,
  } = useAssistantConversation({
    clientId: focusedVoiceStudent ? null : focusedClientId,
    voiceStudentEmail: focusedVoiceStudent?.email || null,
    voiceStudentName: focusedVoiceStudent?.name || null,
  });

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
    loadClients();
    loadVoiceStudents();
  }, [loadClients, loadVoiceStudents]);

  // Thin wrappers adding this page's own concerns (client focus follows the
  // selected conversation; mobile shows one pane at a time) on top of the
  // shared hook's base behavior.
  const selectConversation = (id: string) => {
    const convo = conversations.find((c) => c.id === id);
    setFocusedClientId(convo?.client_id || (convo?.voice_student_email ? voiceStudentIdFor(convo.voice_student_email) : null));
    selectConversationBase(id);
    setMobileShowList(false);
  };

  const startNewChat = () => {
    startNewChatBase();
    setMobileShowList(false);
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
  // Client-specific threads now live on their own Client Hub page (see
  // ClientHubPage.tsx) — showing them here too, mixed in with general
  // EA conversations, was a real reported source of confusion.
  const generalConversations = conversations.filter((c) => !c.client_id && !c.voice_student_email);
  const focusedClient = focusedVoiceStudent
    ? { id: focusedClientId as string, name: focusedVoiceStudent.name, email: focusedVoiceStudent.email }
    : clients.find((c) => c.id === focusedClientId) || null;

  const activeClientName = focusedVoiceStudent?.name || clientNameFor(focusedClientId);

  return (
    <AppLayout variant="wide">
      <div ref={aboveGridRef}>
        <PageHeader
          icon={Bot}
          title="Assistant"
          subtitle="Your practice EA — chat, follow-up, inbox, and scheduling in one place."
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" onClick={() => setMetricsCollapsed((v) => !v)}>
                {metricsCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                {metricsCollapsed ? "Show metrics" : "Hide metrics"}
              </Button>
              <ClientPicker clients={clients} voiceStudents={voiceStudents} value={focusedClientId} onChange={setFocusedClientId} />
            </div>
          }
        />
        {/* Collapsible — the metrics bar + follow-up shorthand compete for the
            same fixed viewport height as the chat tabs below, and taller chat
            was explicitly requested; collapsing this reclaims that space
            immediately since gridHeight recomputes off this container's
            actual rendered height (see the ResizeObserver above). */}
        {!metricsCollapsed && (
          <div className="mt-6">
            <KeyMetricsBar onOpenFollowUp={() => setActiveTab("followup")} />
            <NeedsAttentionWidget onOpenFollowUp={() => setActiveTab("followup")} />
          </div>
        )}
      </div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AssistantTab)} className="flex flex-col" style={{ height: gridHeight ? `${gridHeight}px` : "calc(100vh - 300px)", minHeight: 420 }}>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="chat" className="gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> Chat</TabsTrigger>
            <TabsTrigger value="followup" className="gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> Follow-up</TabsTrigger>
            <TabsTrigger value="inbox" className="gap-1.5"><Mail className="h-3.5 w-3.5" /> Inbox</TabsTrigger>
            <TabsTrigger value="launch" className="gap-1.5"><Rocket className="h-3.5 w-3.5" /> Launch</TabsTrigger>
          </TabsList>
          {/* Not a true embedded tab — the Timetable Simulator is a large, separate
              page (2600+ lines) that doesn't yet follow this app's pane-extraction
              convention, so embedding it inline safely needs its own pass. This
              link is styled to sit alongside the tabs rather than pretending to be one. */}
          <Button asChild variant="outline" size="sm" className="h-9 text-xs gap-1.5">
            <RouterLink to="/timetable"><CalendarRange className="h-3.5 w-3.5" /> Timetable Simulator <ArrowUpRight className="h-3 w-3" /></RouterLink>
          </Button>
        </div>

        <TabsContent value="chat" className="flex-1 min-h-0 m-0">
          {/* No outer card frame — ConversationList's own border-r is enough of a
              divider; the tab area itself is the page, not a widget inside it. */}
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-0 h-full">
            <div className={cn("min-h-0 min-w-0", mobileShowList ? "flex" : "hidden", "md:flex")}>
              <ConversationList
                conversations={generalConversations}
                activeId={activeId}
                onSelect={selectConversation}
                onNew={startNewChat}
                onDelete={deleteConversation}
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
              {focusedClient && (
                <ClientSnapshotPanel
                  clientId={focusedClient.id}
                  clientName={focusedClient.name}
                  isVoice={!!focusedVoiceStudent}
                  onDraftRateEmail={(prompt) => handleSend(prompt)}
                />
              )}
              {/* This chat's own thread stays right here (it's excluded from
                  the general list above once created) — the Hub link is for
                  jumping to their full conversation history + email thread,
                  not a redirect away from what you're currently doing. */}
              {focusedClient && !focusedVoiceStudent && (
                <RouterLink to={`/clients/${focusedClient.id}/hub`} className="text-[11px] text-primary hover:underline mb-3 inline-flex items-center gap-1 w-fit">
                  Open {focusedClient.name.split(" ")[0]}'s full Hub (all conversations, email, history) →
                </RouterLink>
              )}
              {focusedClient && (
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
              {viewMode === "email" && focusedClient ? (
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
                    onRetry={(id, text) => handleSend(text, id)}
                  />
                  <AssistantInput onSend={handleSend} disabled={isSending} initialValue={initialPrompt} />
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="followup" className="flex-1 min-h-0 m-0">
          {/* Deliberately no card/border/rounded box here — Chat, Follow-up, and
              Inbox are real working surfaces, not widgets, so each gets the full
              tab area as its own page-like space. (flex lives on this inner
              wrapper, not TabsContent itself — Tailwind's `.flex{display:flex}`
              beats Radix's [hidden] attribute at equal specificity when applied
              directly to TabsContent, which made all panels render at once.) */}
          <div className="h-full flex flex-col">
            <FollowUpTab />
          </div>
        </TabsContent>

        <TabsContent value="inbox" className="flex-1 min-h-0 m-0">
          <div className="h-full flex flex-col">
            <CommsInbox />
          </div>
        </TabsContent>

        <TabsContent value="launch" className="flex-1 min-h-0 m-0">
          <div className="h-full flex flex-col">
            <LaunchCampaignTab />
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
