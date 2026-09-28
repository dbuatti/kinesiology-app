import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PendingBooking } from "@/types/assistant";
import { PROPOSALS_CHANGED } from "@/lib/booking-proposals";
import BookingProposalCard from "./BookingProposalCard";
import { CalendarClock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** Only this person's (kinesiology client id and/or lesson email). */
  clientId?: string | null;
  email?: string | null;
  /** Inside a fixed-height chat pane: cap the open list's height. */
  contained?: boolean;
  className?: string;
}

type Row = {
  id: string; kind: "fnh" | "voice"; client_id: string | null; student_name: string | null; student_email: string | null;
  event_type_id: string | null; slot_start: string; reason: string | null; discipline?: string | null;
  clients: { name: string | null } | { name: string | null }[] | null;
};

function toPending(p: Row): PendingBooking {
  const client = Array.isArray(p.clients) ? p.clients[0] : p.clients;
  return {
    client_id: p.kind === "fnh" ? p.client_id : null,
    voice_student_email: p.kind === "voice" ? p.student_email : null,
    client_name: p.student_name || client?.name || "Someone",
    start_iso: p.slot_start,
    event_type_id: p.event_type_id,
    notes: p.reason,
    discipline: p.kind === "voice" ? p.discipline ?? null : null,
    proposal_id: p.id,
  };
}

/**
 * Every pencilled booking still waiting to be confirmed — from the Assistant or
 * the Timetable — with Confirm / Discard / Confirm all. Lives outside the chat,
 * so proposals never get lost when the conversation moves on.
 */
export default function PendingBookingsPanel({ clientId, email, contained, className }: Props) {
  const [bookings, setBookings] = useState<PendingBooking[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("booking_proposals")
      .select("*, clients(name)")
      .eq("status", "proposed")
      .gte("slot_start", new Date().toISOString())
      .order("slot_start", { ascending: true })
      .limit(50);
    if (error) return;
    const wantEmail = email?.trim().toLowerCase() || null;
    const rows = ((data || []) as Row[]).filter((p) => {
      if (!clientId && !wantEmail) return true;
      return (!!clientId && p.client_id === clientId) || (!!wantEmail && (p.student_email || "").trim().toLowerCase() === wantEmail);
    });
    setBookings(rows.map(toPending));
  }, [clientId, email]);

  useEffect(() => {
    load();
    window.addEventListener(PROPOSALS_CHANGED, load);
    return () => window.removeEventListener(PROPOSALS_CHANGED, load);
  }, [load]);

  if (!bookings.length) return null;

  const names = [...new Set(bookings.map((b) => b.client_name.split(" ")[0]))];

  return (
    <div className={cn("rounded-xl border border-chart-emerald/40 bg-chart-emerald/5", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
        aria-expanded={open}
      >
        <CalendarClock className="h-4 w-4 shrink-0 text-chart-emerald" />
        <span className="font-semibold text-chart-emerald">Pending bookings · {bookings.length}</span>
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          to confirm — {names.slice(0, 4).join(", ")}{names.length > 4 ? ` +${names.length - 4}` : ""}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className={cn("px-3 pb-3", contained && "max-h-[45vh] overflow-y-auto")}>
          {/* Resolving a card fires PROPOSALS_CHANGED, which reloads this list. */}
          <BookingProposalCard bare bookings={bookings} onResolved={() => undefined} />
        </div>
      )}
    </div>
  );
}
