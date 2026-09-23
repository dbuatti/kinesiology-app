import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useParams, useSearchParams, Link as RouterLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { useAssistantConversation } from "@/hooks/useAssistantConversation";
import { isVoiceStudentId, emailFromVoiceStudentId } from "@/lib/voice-student-id";
import { fetchNormalizedVoiceBookings } from "@/lib/voiceBookings";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import ConversationList from "@/components/assistant/ConversationList";
import MessageList from "@/components/assistant/MessageList";
import AssistantInput from "@/components/assistant/AssistantInput";
import ClientEmailThread from "@/components/assistant/ClientEmailThread";
import ClientSnapshotPanel from "@/components/assistant/ClientSnapshotPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, MessageCircle, Mail, ArrowLeft, ExternalLink, Mic, Brain } from "lucide-react";

interface HubClient {
  id: string; // clients.id, or the raw "voice:<email>" pseudo-id
  name: string;
  email: string | null;
  phone: string | null;
  isVoice: boolean;
}

// The dedicated "everything about this one client" business view — separate
// from ClientDetailPage (clinical: assessments, session notes) and from the
// general Assistant (EA-style, all clients). Covers BOTH arms equally, same
// as every other part of this assistant — voice students are never a
// second-class case here. Click a client's name anywhere in the Follow-up
// list / Launch Campaign tracker and you land here.
export default function ClientHubPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = rawId ? decodeURIComponent(rawId) : undefined;
  const isVoice = isVoiceStudentId(id || null);
  // Deep-link entry point from Follow-up/Needs-attention quick actions, e.g.
  // /clients/<id>/hub?prompt=<text> — same convention AssistantPage already uses.
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || "";
  const [client, setClient] = useState<HubClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"chat" | "email">(searchParams.get("view") === "email" ? "email" : "chat");
  const [mobileShowList, setMobileShowList] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      if (isVoice) {
        const email = emailFromVoiceStudentId(id);
        // fetchNormalizedVoiceBookings merges Notion-only lessons in too —
        // a raw voice_bookings query here missed anyone whose lessons were
        // only ever logged in Notion (real bug: Bella's Hub page showed her
        // raw email as the page title since she has zero voice_bookings
        // rows at all).
        const allBookings = await fetchNormalizedVoiceBookings();
        const match = allBookings.find((b) => b.studentEmail.toLowerCase() === email.toLowerCase());
        if (cancelled) return;
        setClient({ id, name: match?.studentName || email, email, phone: null, isVoice: true });
        setLoading(false);
      } else {
        const { data, error } = await supabase.from("clients").select("id, name, email, phone").eq("id", id).maybeSingle();
        if (cancelled) return;
        if (error || !data) { showError("Couldn't load this client."); setLoading(false); return; }
        setClient({ ...data, isVoice: false });
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isVoice]);

  const {
    conversations, activeId, messages, isSending, streamingText, statusText, pendingDraft, pendingBooking,
    selectConversation, startNewChat, handleSend,
    handleDraftSent, handleDraftDiscard, handleBookingConfirmed, handleBookingDiscard, deleteConversation,
  } = useAssistantConversation({
    clientId: isVoice ? null : (id || null),
    voiceStudentEmail: isVoice && id ? emailFromVoiceStudentId(id) : null,
    voiceStudentName: client?.name || null,
    filterToClient: true,
  });

  // Same viewport-fill approach as AssistantPage — measure everything above
  // the working area and size it to exactly fill what's left, so the outer
  // page never grows a second scrollbar alongside the panes below.
  const aboveRef = useRef<HTMLDivElement>(null);
  const [areaHeight, setAreaHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = aboveRef.current;
    if (!el) return;
    // Same iPad/iOS Safari fix as AssistantPage's gridHeight — window.innerHeight
    // doesn't shrink when the on-screen keyboard opens, only
    // window.visualViewport.height does, which also fires its own resize
    // event on keyboard show/hide (plain "resize" doesn't reliably catch it
    // on iOS). Using plain innerHeight left real dead space behind the
    // keyboard on a real iPad.
    const vh = () => window.visualViewport?.height ?? window.innerHeight;
    // rAF-coalesced + change-guarded, same iPad fix as AssistantPage's
    // gridHeight — the on-screen keyboard fires a burst of resize events while
    // typing, and each naive recompute re-rendered the whole page per keystroke.
    let raf = 0;
    const recompute = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = Math.max(420, vh() - el.getBoundingClientRect().bottom - 32);
        setAreaHeight((prev) => (prev === next ? prev : next));
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

  if (loading) {
    return <AppLayout variant="wide"><p className="text-sm text-muted-foreground py-16 text-center">Loading...</p></AppLayout>;
  }
  if (!client) {
    return <AppLayout variant="wide"><p className="text-sm text-muted-foreground py-16 text-center">Client not found.</p></AppLayout>;
  }

  const selectConversationMobile = (cid: string) => { selectConversation(cid); setMobileShowList(false); };
  const startNewChatMobile = () => { startNewChat(); setMobileShowList(false); };
  const clientNameFor = () => client.name;

  return (
    // min-h-0 overrides AppLayout's default min-h-screen — same fix as
    // AssistantPage's Chat tab: this page's own areaHeight measurement
    // already keeps it at least viewport-filling, so the forced 100vh here
    // only ever added a few dozen px of extra outer scroll on top of the
    // chat/email pane's own internal scroll region.
    <AppLayout variant="wide" className="min-h-0">
      <div ref={aboveRef}>
        <PageHeader
          icon={User}
          title={client.name}
          subtitle={
            <span className="flex items-center gap-1.5">
              {client.isVoice ? <Mic className="h-3.5 w-3.5 text-chart-destructive" /> : <Brain className="h-3.5 w-3.5 text-chart-purple" />}
              {[client.email, client.phone].filter(Boolean).join(" · ") || "No contact details on file"}
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                <RouterLink to="/assistant"><ArrowLeft className="h-3.5 w-3.5" /> Assistant</RouterLink>
              </Button>
              {!client.isVoice && (
                <Button asChild variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                  <RouterLink to={`/clients/${client.id}`}><ExternalLink className="h-3.5 w-3.5" /> Clinical Profile</RouterLink>
                </Button>
              )}
            </div>
          }
        />
        <div className="mt-6">
          <ClientSnapshotPanel
            clientId={client.id}
            clientName={client.name}
            isVoice={client.isVoice}
            onDraftRateEmail={(prompt) => handleSend(prompt)}
          />
        </div>
      </div>

      <div style={{ height: areaHeight ? `${areaHeight}px` : "calc(100vh - 300px)", minHeight: 420 }} className="flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-0 flex-1 min-h-0">
          <div className={cn("min-h-0 min-w-0", mobileShowList ? "flex" : "hidden", "md:flex")}>
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              onSelect={selectConversationMobile}
              onNew={startNewChatMobile}
              onDelete={deleteConversation}
              clientNameFor={clientNameFor}
            />
          </div>
          <div className={cn("flex-col p-4 min-w-0 min-h-0", mobileShowList ? "hidden" : "flex", "md:flex")}>
            {/* One unified top bar: mobile back + thread name on the left, the
                AI Chat / Email Thread toggle on the right — matches the
                Assistant page's toolbar instead of a separate stacked row. */}
            <div className="flex items-center gap-2 pb-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 md:hidden" onClick={() => setMobileShowList(true)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold text-foreground truncate flex-1 md:hidden">Conversations with {client.name.split(" ")[0]}</span>
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg ml-auto">
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
            </div>
            <div className="flex min-h-0 flex-1 flex-col w-full max-w-[880px]">
              {viewMode === "email" ? (
                <ClientEmailThread clientId={client.id} clientEmail={client.email} clientName={client.name} />
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
                    onRetry={(cid, text) => handleSend(text, cid)}
                  />
                  {/* autoSend safe unconditionally here (unlike AssistantPage) —
                      this component doesn't render past the loading/not-found
                      guards above until `client` has already resolved, so
                      there's no async race to gate on. Same fix as
                      AssistantPage: a deep-linked "Book"/"Assistant" quick
                      action is already a complete instruction, so it sends
                      itself instead of waiting for a redundant manual Send. */}
                  <AssistantInput onSend={handleSend} disabled={isSending} initialValue={initialPrompt} autoSend={!!initialPrompt} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
