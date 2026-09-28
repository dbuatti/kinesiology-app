import { useState } from "react";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/utils/toast";
import { PendingBooking } from "@/types/assistant";
import { confirmBooking, dropBooking } from "@/lib/booking-proposals";
import { CalendarPlus, Check, Loader2, X, Mic, Music, Brain } from "lucide-react";

function fmtMelbourne(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "Australia/Melbourne" });
  const time = d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Melbourne" });
  return `${date} at ${time}`;
}

function sessionLabel(b: PendingBooking) {
  if (!b.voice_student_email) return "Kinesiology";
  return (b.discipline || "voice").toLowerCase() === "piano" ? "Piano lesson" : "Voice lesson";
}

// The model can only propose — this Confirm click is what makes a booking real.
async function confirmPending(b: PendingBooking) {
  return confirmBooking({
    proposalId: b.proposal_id,
    kind: b.voice_student_email ? "voice" : "fnh",
    clientId: b.client_id,
    name: b.client_name,
    email: b.voice_student_email,
    startISO: b.start_iso,
    eventTypeId: b.event_type_id,
    notes: b.notes,
    discipline: b.discipline,
  });
}

interface Props {
  bookings: PendingBooking[];
  /** Called once per card that's confirmed or discarded. */
  onResolved: (booking: PendingBooking) => void | Promise<void>;
  /** No border/background of its own — when a panel already provides one. */
  bare?: boolean;
}

/** Every booking the assistant pencilled in this reply, each with Confirm, plus Confirm all. */
export default function BookingProposalCard({ bookings, onResolved, bare }: Props) {
  const [working, setWorking] = useState<Set<PendingBooking>>(new Set());
  const [confirmingAll, setConfirmingAll] = useState(false);

  const mark = (b: PendingBooking, on: boolean) =>
    setWorking((prev) => {
      const next = new Set(prev);
      if (on) next.add(b); else next.delete(b);
      return next;
    });

  const confirmOne = async (b: PendingBooking, quiet = false) => {
    mark(b, true);
    try {
      const { alreadyBooked } = await confirmPending(b);
      if (!quiet) showSuccess(alreadyBooked ? `${b.client_name} was already booked for ${fmtMelbourne(b.start_iso)}.` : `Booked ${b.client_name} for ${fmtMelbourne(b.start_iso)}.`);
      await onResolved(b);
      return true;
    } catch (err) {
      showError(`${fmtMelbourne(b.start_iso)}: ${(err as Error)?.message || "Failed to create the booking."}`);
      return false;
    } finally {
      mark(b, false);
    }
  };

  // One at a time, so Cal.com sees them in order and a failure doesn't hide the rest.
  const confirmAll = async () => {
    setConfirmingAll(true);
    let booked = 0;
    for (const b of [...bookings]) if (await confirmOne(b, true)) booked += 1;
    setConfirmingAll(false);
    const failed = bookings.length - booked;
    if (booked) showSuccess(`Booked ${booked} session${booked === 1 ? "" : "s"}${failed ? ` — ${failed} still to confirm` : ""}.`);
  };

  const discard = async (b: PendingBooking) => {
    mark(b, true);
    try {
      if (b.proposal_id) await dropBooking(b.proposal_id);
      await onResolved(b);
    } catch (err) {
      showError((err as Error)?.message || "Couldn't discard that booking.");
    } finally {
      mark(b, false);
    }
  };

  if (!bookings.length) return null;
  const busy = confirmingAll || working.size > 0;

  return (
    <div className={bare ? "space-y-3" : "rounded-xl border border-chart-emerald/40 bg-chart-emerald/5 p-3 sm:p-4 space-y-3"}>
      <div className={bare && bookings.length < 2 ? "hidden" : "flex flex-wrap items-center justify-between gap-2"}>
        <p className={bare ? "text-xs text-muted-foreground" : "flex items-center gap-2 text-sm font-semibold text-chart-emerald"}>
          {!bare && <CalendarPlus className="h-4 w-4" />}
          {bare
            ? "Not booked in Cal.com until you confirm."
            : bookings.length === 1 ? "Proposed booking — not confirmed yet" : `${bookings.length} proposed bookings — not confirmed yet`}
        </p>
        {bookings.length > 1 && (
          <Button size="sm" onClick={confirmAll} disabled={busy} className="bg-chart-emerald hover:bg-chart-emerald/90">
            {confirmingAll ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
            Confirm all {bookings.length}
          </Button>
        )}
      </div>

      <ul className="divide-y divide-chart-emerald/20">
        {bookings.map((b) => {
          const isVoice = !!b.voice_student_email;
          const isPiano = isVoice && (b.discipline || "").toLowerCase() === "piano";
          const Icon = !isVoice ? Brain : isPiano ? Music : Mic;
          const rowBusy = working.has(b);
          return (
            <li key={b.proposal_id || `${b.start_iso}-${b.client_name}`} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Icon className={`h-3.5 w-3.5 ${isVoice ? "text-chart-destructive" : "text-chart-purple"}`} />
                  {b.client_name}
                  <span className="text-xs font-normal text-muted-foreground">· {sessionLabel(b)}</span>
                </p>
                <p className="text-muted-foreground">{fmtMelbourne(b.start_iso)}</p>
                {b.notes && <p className="text-xs text-muted-foreground mt-0.5">{b.notes}</p>}
              </div>
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => discard(b)} disabled={busy}>
                  <X className="h-4 w-4 mr-1" /> Discard
                </Button>
                <Button size="sm" variant={bookings.length > 1 ? "outline" : "default"} onClick={() => confirmOne(b)} disabled={busy}
                  className={bookings.length > 1 ? "" : "bg-chart-emerald hover:bg-chart-emerald/90"}>
                  {rowBusy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                  Confirm
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {!bare && (
        <p className="text-[11px] text-muted-foreground">
          Nothing is booked in Cal.com until you confirm. Until then these stay in Pending bookings (top of the Assistant) and on the Timetable.
        </p>
      )}
    </div>
  );
}
