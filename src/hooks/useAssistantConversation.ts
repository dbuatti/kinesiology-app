import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { AssistantConversation, AssistantMessage, DraftEmail, PendingBooking } from "@/types/assistant";

// --- Module-scope chat job -------------------------------------------------
// A send must survive navigating away and back: SPA route changes unmount
// AssistantPage/ClientHubPage, which would otherwise strand an in-flight
// generation with nobody left to render (or finish reconciling) it — that's
// the "it stops if I navigate away" report. The job lives at module scope
// (outlives any single mount); mounted hook instances subscribe via
// jobListeners and re-render from it. Returning to the page re-attaches,
// replays the accumulated streamed text, and keeps receiving events.
interface ChatJob {
  streamedText: string;
  statusText: string | null;
  done: boolean;
  conversationId: string | null;
  error: string | null;
}
let activeChatJob: ChatJob | null = null;
type JobListener = (job: ChatJob) => void;
const jobListeners = new Set<JobListener>();
// The most recently completed conversation, so a page that instantiated fresh
// after a navigate-away can bring the finished answer back into view.
let lastFinishedConversation: string | null = null;

export interface ChatResult {
  conversation_id?: string | null;
  reply?: string | null;
  draft_email?: DraftEmail | null;
  pending_booking?: PendingBooking | null;
  error?: string | null;
  quota_exceeded?: boolean | null;
  text?: string | null;
}

function notifyJob(job: ChatJob) {
  for (const l of jobListeners) l(job);
}

// Streams assistant-chat (the edge function now sends Server-Sent Events) over
// plain fetch — supabase.functions.invoke can't read a body stream. The caller
// stays mounted or not; the job keeps running either way.
async function streamedAssistantChat(
  body: Record<string, unknown>,
  handlers: {
    onMeta: (conversationId: string | null) => void;
    onStatus: (text: string | null) => void;
    onDelta: (text: string) => void;
    onReset: () => void;
    onDone: (data: ChatResult) => void;
    onError: (data: ChatResult) => void;
  },
) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in.");
  // supabaseUrl is `protected` on SupabaseClient; the generated client module doesn't export it.
  const { supabaseUrl } = supabase as unknown as { supabaseUrl: string };
  const res = await fetch(`${supabaseUrl}/functions/v1/assistant-chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: session.access_token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `Assistant request failed (${res.status}).`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch { /* keep the status fallback */ }
    throw new Error(msg);
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream.");

  const decoder = new TextDecoder();
  let buf = "";
  let event: string | null = null;
  const dataParts: string[] = [];

  const dispatch = () => {
    if (!event) return;
    const raw = dataParts.join("");
    dataParts.length = 0;
    const evt = event;
    event = null;
    let data: Record<string, unknown> = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }
    if (evt === "meta") handlers.onMeta(typeof data?.conversation_id === "string" ? data.conversation_id : null);
    else if (evt === "status") handlers.onStatus(typeof data?.text === "string" ? data.text : null);
    else if (evt === "delta") handlers.onDelta(typeof data?.text === "string" ? data.text : "");
    else if (evt === "reset") handlers.onReset();
    else if (evt === "done") handlers.onDone(data);
    else if (evt === "error") handlers.onError(data);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const block = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      for (const line of block.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7).trim();
        else if (line.startsWith("data: ")) dataParts.push(line.slice(6));
      }
      dispatch();
    }
  }
}

// Shared stateful chat logic used by both AssistantPage's general Chat tab
// (unfiltered conversation list — every thread, focus set per-conversation)
// and ClientHubPage's dedicated per-client view (filtered to just that
// client's own threads). Extracted so the two never silently diverge on
// things like the draft/booking persistence or retry behavior.
interface Options {
  clientId: string | null;
  voiceStudentEmail: string | null;
  voiceStudentName?: string | null;
  // When set, only conversations for this exact client/voice-student are
  // loaded and a new conversation is always created scoped to them — used by
  // ClientHubPage. When omitted, all of the user's conversations load
  // (AssistantPage's general Chat tab), and client focus is read back per row.
  filterToClient?: boolean;
}

export function useAssistantConversation({ clientId, voiceStudentEmail, voiceStudentName, filterToClient }: Options) {
  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  // Streamed-in reply text plus a live "what the assistant is doing" line
  // ("Checking real availability…") — the two things that make generation feel
  // alive instead of a silent hold.
  const [streamingText, setStreamingText] = useState("");
  const [statusText, setStatusText] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<DraftEmail | null>(null);
  const [pendingDraftMessageId, setPendingDraftMessageId] = useState<string | null>(null);
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null);
  const [pendingBookingMessageId, setPendingBookingMessageId] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    let query = supabase.from("assistant_conversations").select("*").is("deleted_at", null).order("updated_at", { ascending: false });
    if (filterToClient) {
      query = voiceStudentEmail ? query.eq("voice_student_email", voiceStudentEmail) : query.eq("client_id", clientId);
    }
    const { data, error } = await query;
    if (error) { showError("Failed to load conversations."); return; }
    setConversations(data || []);
  }, [filterToClient, clientId, voiceStudentEmail]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

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

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    loadMessages(id);
  }, [loadMessages]);

  const startNewChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setStreamingText("");
    setStatusText(null);
    setPendingDraft(null);
    setPendingDraftMessageId(null);
    setPendingBooking(null);
    setPendingBookingMessageId(null);
  }, []);

  // Mount: re-attach to any in-flight (or just-completed) job. This is the
  // navigation fix — generation kept running while the page was unmounted, and
  // on return we copy its accumulated state back into local state and keep
  // receiving events. Also refresh the job's conversation so the finished
  // answer is actually visible, not just sitting in the DB.
  const didReattachRef = useRef(false);
  useEffect(() => {
    const apply = (job: ChatJob) => {
      setStatusText(job.statusText);
      setStreamingText(job.streamedText);
      setIsSending(!job.done && !job.error);
    };
    const listener: JobListener = apply;
    jobListeners.add(listener);
    const existing = activeChatJob;
    if (existing) {
      apply(existing);
      if (existing.done && existing.conversationId && !didReattachRef.current) {
        didReattachRef.current = true;
        if (filterToClient || !activeId) {
          const cid = existing.conversationId;
          setActiveId(cid);
          loadMessages(cid);
          if (!filterToClient) loadConversations();
        }
      }
    }
    return () => { jobListeners.delete(listener); };
    // Deliberately mount-only: re-using the latest values would re-subscribe on
    // every keystroke-proxying state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // General page only: if a generation finished while this page was unmounted
  // (activeId reset to null), select that conversation so the finished answer
  // is the first thing seen on return instead of an empty list.
  useEffect(() => {
    if (filterToClient) return;
    if (lastFinishedConversation && !activeId && !didReattachRef.current) {
      didReattachRef.current = true;
      selectConversation(lastFinishedConversation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = useCallback(async (text: string, retryId?: string, sendClientId?: string | null, sendVoiceEmail?: string | null, sendVoiceName?: string | null) => {
    setIsSending(true);
    setStatusText(null);
    setStreamingText("");
    const effectiveClientId = sendClientId !== undefined ? sendClientId : clientId;
    const effectiveVoiceEmail = sendVoiceEmail !== undefined ? sendVoiceEmail : voiceStudentEmail;
    const effectiveVoiceName = sendVoiceName !== undefined ? sendVoiceName : voiceStudentName;
    // Optimistic local message so the UI feels responsive while the model runs.
    // Reuse the failed message's id on retry instead of appending a new one.
    const optimisticId = retryId || `local-${Date.now()}`;
    setMessages((prev) => {
      const withoutFailed = prev.filter((m) => m.id !== optimisticId);
      return [...withoutFailed, { id: optimisticId, conversation_id: activeId || "", role: "user", content: text, created_at: new Date().toISOString(), failed: false }];
    });

    const job: ChatJob = { streamedText: "", statusText: null, done: false, conversationId: activeId, error: null };
    activeChatJob = job;
    const apply = (j: ChatJob) => {
      setStatusText(j.statusText);
      setStreamingText(j.streamedText);
      setIsSending(!j.done);
    };
    const listener: JobListener = apply;
    jobListeners.add(listener);
    notifyJob(job);

    try {
      await streamedAssistantChat({
        conversation_id: activeId,
        client_id: effectiveVoiceEmail ? null : effectiveClientId,
        voice_student_email: effectiveVoiceEmail || null,
        voice_student_name: effectiveVoiceEmail ? effectiveVoiceName || null : null,
        message: text,
      }, {
        onMeta: (cid) => { if (cid) job.conversationId = cid; },
        onStatus: (t) => { job.statusText = t; notifyJob(job); },
        onDelta: (t) => { job.streamedText += t; notifyJob(job); },
        onReset: () => { job.streamedText = ""; notifyJob(job); },
        onDone: async (data) => {
          const cid = data?.conversation_id || job.conversationId;
          lastFinishedConversation = cid || lastFinishedConversation;
          job.done = true;
          job.conversationId = cid || null;
          job.statusText = null;
          // Fall back to what was streamed if the done payload omits the reply.
          job.streamedText = typeof data?.reply === "string" ? data.reply : job.streamedText;
          setActiveId(cid || null);
          setPendingDraft(data?.draft_email || null);
          setPendingBooking(data?.pending_booking || null);
          notifyJob(job);
          try {
            if (cid) await Promise.all([loadMessages(cid), loadConversations()]);
          } finally {
            // Authoritative copy now lives in assistant_messages — drop the
            // transient stream so the rendered list doesn't double up.
            job.streamedText = "";
            notifyJob(job);
            setIsSending(false);
          }
        },
        onError: (data) => {
          job.done = true;
          job.error = data?.error || "The assistant couldn't respond just then.";
          job.streamedText = "";
          notifyJob(job);
        },
      });
      // onError doesn't reject the stream (errors are sent as an SSE event);
      // surface it through the shared retry path below.
      if (job.error) throw new Error(job.error);
    } catch (err: any) {
      const msg = err.message || "";
      const isQuota = /quota|resource_exhausted|rate limit|429/i.test(msg);
      showError(isQuota ? "The assistant is temporarily out of capacity — try again in a moment, or hit Retry below." : (msg || "The assistant couldn't respond just then."));
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, failed: true } : m)));
    } finally {
      setIsSending(false);
      jobListeners.delete(listener);
      notifyJob(job);
    }
  }, [activeId, clientId, voiceStudentEmail, voiceStudentName, loadMessages, loadConversations]);

  // Resolving a draft/booking (sent, confirmed, or discarded) clears it in the
  // DB, not just local state — otherwise reloading the conversation, or
  // loadMessages running again after the next turn, would resurrect an
  // already-resolved one and risk it being sent/booked again.
  const clearPersistedDraft = useCallback(async () => {
    if (pendingDraftMessageId) {
      await supabase.from("assistant_messages").update({ draft_email: null }).eq("id", pendingDraftMessageId);
    }
    setPendingDraft(null);
    setPendingDraftMessageId(null);
  }, [pendingDraftMessageId]);

  const clearPersistedBooking = useCallback(async () => {
    if (pendingBookingMessageId) {
      await supabase.from("assistant_messages").update({ pending_booking: null }).eq("id", pendingBookingMessageId);
    }
    setPendingBooking(null);
    setPendingBookingMessageId(null);
  }, [pendingBookingMessageId]);

  const deleteConversation = useCallback(async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) startNewChat();
    const { error } = await supabase.from("assistant_conversations").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) { showError("Couldn't delete that conversation."); loadConversations(); return; }
    toast("Chat deleted", {
      action: {
        label: "Undo",
        onClick: async () => {
          await supabase.from("assistant_conversations").update({ deleted_at: null }).eq("id", id);
          loadConversations();
        },
      },
    });
  }, [activeId, startNewChat, loadConversations]);

  return {
    conversations, activeId, messages, isSending, streamingText, statusText, pendingDraft, pendingBooking,
    loadConversations, selectConversation, startNewChat, handleSend,
    handleDraftSent: clearPersistedDraft, handleDraftDiscard: clearPersistedDraft,
    handleBookingConfirmed: clearPersistedBooking, handleBookingDiscard: clearPersistedBooking,
    deleteConversation,
  };
}