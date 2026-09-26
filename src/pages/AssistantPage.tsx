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

  const [activeTab, setActiveTab] = useState<AssistantTab>(viewParam === "inbox" || viewParam === "followup" ? viewParam : "chat");
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
    // iPad/iOS Safari real-device bug ("white space at bottom... scroll
    // bars in chat... generally weird"): window.innerHeight does NOT shrink
    // when the on-screen keyboard opens — only window.visualViewport.height
    // reflects the actually-visible area above it. Using plain innerHeight
    // here sized the chat pane as if the full screen were visible, leaving
    // real dead space behind the keyboard. visualViewport also fires its
    // own resize event on keyboard show/hide, which plain "resize" doesn't
    // reliably catch on iOS.
    const vh = () => window.visualViewport?.height ?? window.innerHeight;
    // Throttled via rAF with a change-guard. On iPad, the on-screen keyboard
    // fires a burst of visualViewport/ResizeObserver resize events (keyboard
    // opening animation + the autocorrect suggestion bar changing height while
    // typing). Without coalescing, each event forced a sync layout read and a
    // setGridHeight that re-rendered the ENTIRE page — every message bubble,
    // conversation list row and metrics widget — per keystroke, which is
    // exactly the slow-typing jank seen on a real iPad.
    let raf = 0;
    const recompute = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Leave room for the phone/tablet bottom tab bar when it's showing.
        const tabBar = (document.querySelector('nav[aria-label="Primary"]') as HTMLElement | null)?.offsetHeight ?? 0;
        const next = Math.max(380, vh() - el.getBoundingClientRect().bottom - 32 - tabBar);
        // Functional update + equality guard: if nothing actually changed, React
        // bails out and no re-render happens at all.
        setGridHeight((prev) => (prev === next ? prev : next));
      });
    };
    recompute();
    window.addEventListener("resize", recompute);
    window.visualViewport?.addEventListener("resize", recompute);
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", recompute);
      window.visualViewport?.removeEventListener("resize", recompute);
      ro.disconnect();
    };
  }, []);

  // Voice students use a "voice:<email>" pseudo-id (see ClientPicker) since they
  // aren't rows in `clients` — resolve it back to the real student wherever focus matters.
  const focusedVoiceStudent = focusedClientId && isVoiceStudentId(focusedClientId)
    ? voiceStudents.find((s) => s.email.toLowerCase() === emailFromVoiceStudentId(focusedClientId).toLowerCase()) || null
    : null;

  const {
    conversations, activeId, messages, isSending, streamingText, statusText, pendingDraft, pendingBooking,
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
  // Ready once the deep-linked client/voice-student target has actually
  // resolved (both `clients` and `voiceStudents` load async) — auto-sending
  // before then would go out as an unfocused general message instead of
  // against the intended person. See AssistantInput's own autoSend effect.
  const autoSendReady = !!initialClientId && !!initialPrompt && !!focusedClient;

  return (
    // min-h-0 overrides AppLayout's default min-h-screen (twMerge resolves the
    // conflict) — that forced height meant the page was always at least
    // 100vh tall regardless of how precisely gridHeight measured the Chat
    // tab's own internal height, leaving #main-scroll-container a few dozen
    // px taller than its own available space and giving it a scrollbar of
    // its own alongside the two legitimate ones (conversation list, message
    // list) — "several scroll bars", correctly flagged. Not needed here:
    // Chat is always at least viewport-filling via gridHeight already, and
    // Follow-up/Inbox/Launch are meant to size to their own content.
    <AppLayout variant="wide" className="min-h-0">
      <div ref={aboveGridRef}>
        <PageHeader
          icon={Bot}
          title="Assistant"
          subtitle={<span className="hidden sm:inline">Your practice EA — chat, follow-up, inbox and scheduling in one place.</span>}
          actions={
            <div className="flex items-center gap-2">
              {/* Nothing to toggle once a client is focused — metrics are
                  hidden outright then, not just collapsible. */}
              {!focusedClientId && (
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setMetricsCollapsed((v) => !v)}>
                  {metricsCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                  {metricsCollapsed ? "Show metrics" : "Hide metrics"}
                </Button>
              )}
              <ClientPicker clients={clients} voiceStudents={voiceStudents} value={focusedClientId} onChange={setFocusedClientId} />
            </div>
          }
        />
        {/* Collapsible — the metrics bar + follow-up shorthand compete for the
            same fixed viewport height as the chat tabs below, and taller chat
            was explicitly requested; collapsing this reclaims that space
            immediately since gridHeight recomputes off this container's
            actual rendered height (see the ResizeObserver above).
            Also hidden whenever a client is focused, not just on manual
            collapse: whole-practice revenue/pipeline/quick-wins stats are
            irrelevant once you're already in a specific person's
            conversation, and stacking them above the chat was real,
            reported friction on mobile — several screens of scroll before
            reaching any actual chat content, on a real iPhone. */}
        {!metricsCollapsed && !focusedClientId && (
          <div className="mt-6">
            <KeyMetricsBar onOpenFollowUp={() => setActiveTab("followup")} />
            <NeedsAttentionWidget onOpenFollowUp={() => setActiveTab("followup")} />
          </div>
        )}
      </div>
      {/* Only Chat needs a fixed-height, internally-scrolling pane — that's
          how a real chat UI should behave (input always anchored, history
          scrolls within it). Follow-up/Inbox/Launch are long content lists,
          not chat — boxing them into the same confined height gave them
          their own inner scrollbar instead of just using the page's own
          ("shouldn't it just take the whole page's scroll bar?" — yes).
          So the fixed height only applies while Chat is the active tab. */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as AssistantTab)}
        // shrink-0 stops this explicitly-height-measured box from being
        // compressed below its own height by the ancestor flex chain's
        // default flex-shrink:1 — without it, the Chat pane rendered ~70px
        // shorter than its own measured `style.height`, which was exactly
        // the residual outer-scroll gap still showing on a real phone.
        className={cn("flex flex-col shrink-0", activeTab === "chat" && "min-h-[420px]")}
        style={activeTab === "chat" ? { height: gridHeight ? `${gridHeight}px` : "calc(100vh - 300px)" } : undefined}
      >
        <div className="mb-3 mt-6 flex flex-wrap items-center justify-between gap-2">
          <TabsList className="min-w-0 overflow-x-auto">
            <TabsTrigger value="chat" className="gap-1.5 whitespace-nowrap"><MessageCircle className="h-3.5 w-3.5" /> Chat</TabsTrigger>
            <TabsTrigger value="followup" className="gap-1.5 whitespace-nowrap"><AlertCircle className="h-3.5 w-3.5" /> Follow-up</TabsTrigger>
            <TabsTrigger value="inbox" className="gap-1.5 whitespace-nowrap"><Mail className="h-3.5 w-3.5" /> Inbox</TabsTrigger>
            <TabsTrigger value="launch" className="gap-1.5 whitespace-nowrap"><Rocket className="h-3.5 w-3.5" /> Launch</TabsTrigger>
          </TabsList>
          {/* Not a true embedded tab — the Timetable Simulator is a large, separate
              page (2600+ lines) that doesn't yet follow this app's pane-extraction
              convention, so embedding it inline safely needs its own pass. This
              link is styled to sit alongside the tabs rather than pretending to be one. */}
          <Button asChild variant="outline" size="sm" className="hidden gap-1.5 sm:inline-flex">
            <RouterLink to="/timetable"><CalendarRange className="h-3.5 w-3.5" /> Timetable Simulator <ArrowUpRight className="h-3 w-3" /></RouterLink>
          </Button>
        </div>

        <TabsContent value="chat" className="flex-1 min-h-0 m-0">
          {/* No outer card frame — ConversationList's own border-r is enough of a
              divider; the tab area itself is the page, not a widget inside it. */}
          {/* Chat workspace: history · conversation · client context. One framed
              surface so it reads as a single tool, with the context column only
              when a client is in focus (xl+; below that it collapses to a strip). */}
          <div
            className={cn(
              "grid h-full grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
              "md:grid-cols-[272px_1fr]",
              focusedClient && "xl:grid-cols-[272px_1fr_300px]"
            )}
          >
            <div className={cn("min-h-0 min-w-0 border-r border-border bg-sidebar/50", mobileShowList ? "flex" : "hidden", "md:flex")}>
              <ConversationList
                conversations={generalConversations}
                activeId={activeId}
                onSelect={selectConversation}
                onNew={startNewChat}
                onDelete={deleteConversation}
                clientNameFor={clientNameFor}
              />
            </div>
            <div className={cn("min-h-0 min-w-0 flex-col", mobileShowList ? "hidden" : "flex", "md:flex")}>
              {/* Conversation header */}
              <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3 sm:px-4">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 md:hidden" onClick={() => setMobileShowList(true)} aria-label="Back to chats">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-foreground">
                    {activeClientName ? <span className="blur-sensitive">{activeClientName}</span> : "General"}
                  </p>
                </div>
                {viewMode === "chat" && messages.length > 0 && (
                  <Button variant="ghost" size="sm" className="hidden h-8 gap-1.5 text-muted-foreground md:inline-flex" onClick={copyChatToClipboard}>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                )}
                {focusedClient && (
                  <div className="flex items-center rounded-lg bg-foreground/[0.05] p-[3px]">
                    {([["chat", MessageCircle, "AI chat"], ["email", Mail, "Email"]] as const).map(([v, Icon, label]) => (
                      <button
                        key={v}
                        onClick={() => setViewMode(v)}
                        className={cn(
                          "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium transition-colors",
                          viewMode === v ? "bg-card text-foreground shadow-sm ring-1 ring-border/70" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" /> {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Context strip below xl (the right column takes over above it) */}
              {focusedClient && (
                <div className="hidden px-3 pt-3 sm:px-4 md:block xl:hidden">
                  <ClientSnapshotPanel
                    clientId={focusedClient.id}
                    clientName={focusedClient.name}
                    isVoice={!!focusedVoiceStudent}
                    onDraftRateEmail={(prompt) => handleSend(prompt)}
                  />
                </div>
              )}

              <div className="mx-auto flex min-h-0 w-full max-w-[860px] flex-1 flex-col px-3 pb-3 sm:px-5 sm:pb-4">
                {viewMode === "email" && focusedClient ? (
                  <div className="min-h-0 flex-1 pt-3">
                    <ClientEmailThread clientId={focusedClient.id} clientEmail={focusedClient.email} clientName={focusedClient.name} />
                  </div>
                ) : (
                  <>
                    <MessageList
                      messages={messages}
                      isSending={isSending}
                      streamingContent={streamingText}
                      streamingStatus={statusText}
                      pendingDraft={pendingDraft}
                      onDraftSent={handleDraftSent}
                      onDraftDiscard={handleDraftDiscard}
                      pendingBooking={pendingBooking}
                      onBookingConfirmed={handleBookingConfirmed}
                      onBookingDiscard={handleBookingDiscard}
                      onSuggestion={handleSend}
                      onRetry={(id, text) => handleSend(text, id)}
                      heroTitle={focusedClient ? `Working on ${focusedClient.name.split(" ")[0]}` : undefined}
                      heroSubtitle={focusedClient ? "Everything here is scoped to this client — their history, schedule and emails." : undefined}
                      prompts={
                        focusedClient
                          ? (() => {
                              const f = focusedClient.name.split(" ")[0];
                              return [
                                { label: `Book ${f}'s next session`, prompt: `Find a good slot and book ${f}'s next session.` },
                                { label: `How is ${f} tracking?`, prompt: `Summarise how ${f} is tracking — recent sessions, attendance and anything I should follow up.` },
                                { label: `Draft a check-in`, prompt: `Draft a warm check-in email to ${f} in my usual style.` },
                              ];
                            })()
                          : undefined
                      }
                    />
                    <AssistantInput
                      onSend={handleSend}
                      disabled={isSending}
                      initialValue={initialPrompt}
                      autoSend={autoSendReady}
                      placeholder={focusedClient ? `Ask about ${focusedClient.name.split(" ")[0]}, book them in, or draft a message…` : undefined}
                      suggestions={
                        messages.length === 0
                          ? undefined
                          : focusedClient
                          ? [
                              `Find ${focusedClient.name.split(" ")[0]}'s next best slot`,
                              `Draft a check-in email to ${focusedClient.name.split(" ")[0]}`,
                              `Summarise ${focusedClient.name.split(" ")[0]}'s last few sessions`,
                            ]
                          : ["Who needs a follow-up this week?", "How's my booking load?", "What should I work on today?"]
                      }
                    />
                  </>
                )}
              </div>
            </div>

            {/* Client context column */}
            {focusedClient && (
              <aside className="hidden min-h-0 overflow-y-auto border-l border-border bg-sidebar/40 xl:block">
                <ClientSnapshotPanel
                  variant="card"
                  clientId={focusedClient.id}
                  clientName={focusedClient.name}
                  isVoice={!!focusedVoiceStudent}
                  onDraftRateEmail={(prompt) => handleSend(prompt)}
                />
              </aside>
            )}
          </div>
        </TabsContent>

        <TabsContent value="followup" className="m-0">
          {/* Deliberately no card/border/rounded box here — Chat, Follow-up, and
              Inbox are real working surfaces, not widgets, so each gets the full
              tab area as its own page-like space. (flex lives on this inner
              wrapper, not TabsContent itself — Tailwind's `.flex{display:flex}`
              beats Radix's [hidden] attribute at equal specificity when applied
              directly to TabsContent, which made all panels render at once.)
              No fixed height/overflow here — this flows in the page's own
              scroll, same as Inbox/Launch below. */}
          <FollowUpTab />
        </TabsContent>

        <TabsContent value="inbox" className="m-0">
          <CommsInbox clients={clients} voiceStudents={voiceStudents} />
        </TabsContent>

        <TabsContent value="launch" className="m-0">
          <LaunchCampaignTab />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
