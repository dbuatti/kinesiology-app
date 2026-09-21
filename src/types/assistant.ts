export interface DraftEmail {
  to: string;
  subject: string;
  body: string;
  client_id?: string | null;
  appointment_id?: string | null;
}

export interface PendingBooking {
  client_id: string | null;
  voice_student_email?: string | null;
  client_name: string;
  start_iso: string;
  event_type_id?: number | null;
  notes?: string | null;
  // Row id in the shared `booking_proposals` table (same one the Timetable
  // Simulator reads/writes) — null if that insert failed for some reason,
  // in which case confirming still works but won't show on the Simulator.
  proposal_id?: string | null;
}

export interface AssistantMessage {
  id: string;
  conversation_id: string;
  role: "user" | "model" | "tool";
  content: string | null;
  tool_calls?: { name: string; args: any; result: any }[] | null;
  draft_email?: DraftEmail | null;
  pending_booking?: PendingBooking | null;
  created_at: string;
  // Local-only UI flag for a send that failed before the round-trip completed —
  // never persisted (a failed turn never reaches assistant_messages at all).
  failed?: boolean;
}

export interface AssistantConversation {
  id: string;
  user_id: string;
  client_id: string | null;
  voice_student_email: string | null;
  voice_student_name: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface VoiceStudentOption {
  email: string;
  name: string;
}
