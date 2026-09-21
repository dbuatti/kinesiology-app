import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { AssistantConversation, AssistantMessage, DraftEmail, PendingBooking } from "@/types/assistant";

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
    setPendingDraft(null);
    setPendingDraftMessageId(null);
    setPendingBooking(null);
    setPendingBookingMessageId(null);
  }, []);

  const handleSend = useCallback(async (text: string, retryId?: string, sendClientId?: string | null, sendVoiceEmail?: string | null, sendVoiceName?: string | null) => {
    setIsSending(true);
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

    try {
      const { data, error } = await supabase.functions.invoke("assistant-chat", {
        body: {
          conversation_id: activeId,
          client_id: effectiveVoiceEmail ? null : effectiveClientId,
          voice_student_email: effectiveVoiceEmail || null,
          voice_student_name: effectiveVoiceEmail ? effectiveVoiceName || null : null,
          message: text,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setActiveId(data.conversation_id);
      setPendingDraft(data.draft_email || null);
      setPendingBooking(data.pending_booking || null);
      await Promise.all([loadMessages(data.conversation_id), loadConversations()]);
    } catch (err: any) {
      const msg = err.message || "";
      const isQuota = /quota|resource_exhausted|rate limit|429/i.test(msg);
      showError(isQuota ? "The assistant is temporarily out of capacity — try again in a moment, or hit Retry below." : (msg || "The assistant couldn't respond just then."));
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, failed: true } : m)));
    } finally {
      setIsSending(false);
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
    conversations, activeId, messages, isSending, pendingDraft, pendingBooking,
    loadConversations, selectConversation, startNewChat, handleSend,
    handleDraftSent: clearPersistedDraft, handleDraftDiscard: clearPersistedDraft,
    handleBookingConfirmed: clearPersistedBooking, handleBookingDiscard: clearPersistedBooking,
    deleteConversation,
  };
}
