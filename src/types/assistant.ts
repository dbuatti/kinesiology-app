export interface DraftEmail {
  to: string;
  subject: string;
  body: string;
  client_id?: string | null;
  appointment_id?: string | null;
}

export interface PendingBooking {
  client_id: string;
  client_name: string;
  start_iso: string;
  event_type_id?: number | null;
  notes?: string | null;
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
}

export interface AssistantConversation {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}
