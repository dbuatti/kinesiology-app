import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useParams, useSearchParams, Link as RouterLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { useAssistantConversation } from "@/hooks/useAssistantConversation";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import ConversationList from "@/components/assistant/ConversationList";
import MessageList from "@/components/assistant/MessageList";
import AssistantInput from "@/components/assistant/AssistantInput";
import ClientEmailThread from "@/components/assistant/ClientEmailThread";
import ClientSnapshotPanel from "@/components/assistant/ClientSnapshotPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, MessageCircle, Mail, ArrowLeft, ExternalLink } from "lucide-react";

// The dedicated "everything about this one client" business view — separate
// from ClientDetailPage (clinical: assessments, session notes) and from the
// general Assistant (EA-style, all clients). Click a client's name anywhere
// in the Follow-up list / client list and you land here: AI chat, real email
// thread, and status/rate/history for just them, its own page rather than an
// inline strip inside the general Assistant.
export default function ClientHubPage() {
  const { id } = useParams<{ id: string }>();
  // Deep-link entry point from Follow-up/Needs-attention quick actions, e.g.
  // /clients/<id>/hub?prompt=<text> — same convention AssistantPage already uses.
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || "";
  const [client, setClient] = useState<{ id: string; name: string; email: string | null; phone: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"chat" | "email">(searchParams.get("view") === "email" ? "email" : "chat");
  const [mobileShowList, setMobileShowList] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    supabase.from("clients").select("id, name, email, phone").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) { showError("Couldn't load this client."); setLoading(false); return; }
      setClient(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  const {
    conversations, activeId, messages, isSending, pendingDraft, pendingBooking,
    selectConversation, startNewChat, handleSend,
    handleDraftSent, handleDraftDiscard, handleBookingConfirmed, handleBookingDiscard, deleteConversation,
  } = useAssistantConversation({ clientId: id || null, voiceStudentEmail: null, filterToClient: true });

  // Same viewport-fill approach as AssistantPage — measure everything above
  // the working area and size it to exactly fill what's left, so the outer
  // page never grows a second scrollbar alongside the panes below.
  const aboveRef = useRef<HTMLDivElement>(null);
  const [areaHeight, setAreaHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = aboveRef.current;
    if (!el) return;
    const recompute = () => setAreaHeight(Math.max(420, window.innerHeight - el.getBoundingClientRect().bottom - 32));
    recompute();
    window.addEventListener("resize", recompute);
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => { window.removeEventListener("resize", recompute); ro.disconnect(); };
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
    <AppLayout variant="wide">
      <div ref={aboveRef}>
        <PageHeader
          icon={User}
          title={client.name}
          subtitle={[client.email, client.phone].filter(Boolean).join(" · ") || "No contact details on file"}
          actions={
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                <RouterLink to="/assistant"><ArrowLeft className="h-3.5 w-3.5" /> Assistant</RouterLink>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                <RouterLink to={`/clients/${client.id}`}><ExternalLink className="h-3.5 w-3.5" /> Clinical Profile</RouterLink>
              </Button>
            </div>
          }
        />
        <div className="mt-6">
          <ClientSnapshotPanel
            clientId={client.id}
            clientName={client.name}
            isVoice={false}
            onDraftRateEmail={(prompt) => handleSend(prompt)}
          />
        </div>
      </div>

      <div style={{ height: areaHeight ? `${areaHeight}px` : "calc(100vh - 300px)", minHeight: 420 }} className="flex flex-col">
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
            <div className="flex items-center gap-2 pb-3 md:hidden">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setMobileShowList(true)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold text-foreground truncate flex-1">Conversations with {client.name.split(" ")[0]}</span>
            </div>
            {viewMode === "email" ? (
              <ClientEmailThread clientId={client.id} clientEmail={client.email} clientName={client.name} />
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
                  onRetry={(cid, text) => handleSend(text, cid)}
                />
                <AssistantInput onSend={handleSend} disabled={isSending} initialValue={initialPrompt} />
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
