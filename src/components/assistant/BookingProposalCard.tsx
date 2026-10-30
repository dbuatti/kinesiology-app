import { useState } from "react";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/utils/toast";
import { PendingBooking, AssistantToolCall } from "@/types/assistant";
import { confirmBooking, dropBooking } from "@/lib/booking-proposals";
import { CalendarPlus, Check, Loader2, X, Mic, Music, Brain, ChevronDown, AlertTriangle } from "lucide-react";

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
    rescheduleUid: b.reschedule_uid,
  });
}

interface Props {
  bookings: PendingBooking[];
  /** Called once per card that's confirmed or discarded. */
  onResolved: (booking: PendingBooking) => void | Promise<void>;
  /** No border/background of its own — when a panel already provides one. */
  bare?: boolean;
  /**
   * The tool calls behind this reply, straight from assistant_messages —
   * this is the "why did it pick that slot?" surface. Optional because the
   * Pending bookings panel and email threads read rows, not a turn.
   */
  tools?: AssistantToolCall[] | null;
}

function fmtWindowDay(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "Australia/Melbourne" });
}

/**
 * The reasoning behind a proposal, in the practitioner's words rather than a
 * raw JSON dump: which window was searched, which slots Cal.com actually
 * returned, why each was ranked where it was, and the time that got picked.
 * Answers the one question a human asks before confirming: "is this real?"
 */
function SlotEvidence({ tools, bookings, bare }: { tools: AssistantToolCall[]; bookings: PendingBooking[]; bare?: boolean }) {
  const [open, setOpen] = useState(false);

  const slotCalls = tools.filter((t) => t?.name === "get_available_slots");
  const suggested = slotCalls.flatMap((t) =>
    Array.isArray(t?.result?.suggested) ? (t.result.suggested as { iso: string; label: string; reason?: string }[]) : []
  );
  const window = slotCalls[0]?.args || {};
  const notes = slotCalls.map((t) => t?.result?.note).filter(Boolean) as string[];
  const failures = tools.filter((t) => t?.result?.error);
  const otherTools = tools.filter((t) => t?.name !== "get_available_slots").map((t) => t.name);

  const bookedIsos = new Set(bookings.map((b) => b.start_iso));
  const bookedLabels = new Set(bookings.map((b) => fmtMelbourne(b.start_iso)));

  const title = suggested.length ? "Why this slot?" : "What the assistant checked";

  return (
    <div className={bare ? "pt-1" : "border-t border-chart-emerald/20 pt-2"}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        {title}
      </button>

      {open && (
        <div className="mt-2 space-y-2 rounded-lg border border-border/60 bg-muted/30 p-2.5 text-[11px] leading-relaxed">
          {failures.length > 0 && (
            <div className="space-y-1">
              {failures.map((t, i) => (
                <p key={i} className="flex items-start gap-1.5 text-chart-destructive">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{t.name}: {String(t.result.error)}</span>
                </p>
              ))}
            </div>
          )}

          {slotCalls.length > 0 && (
            <p className="text-muted-foreground">
              Checked Cal.com
              {window.start && window.end ? ` for ${fmtWindowDay(window.start)} – ${fmtWindowDay(window.end)}` : ""}
              {window.client_id ? ", ranked against this client's own history" : ""}.
            </p>
          )}

          {notes.map((n, i) => (
            <p key={i} className="text-muted-foreground italic">{n}</p>
          ))}

          {suggested.length > 0 ? (
            <ul className="space-y-1">
              {suggested.map((s) => {
                const picked = bookedIsos.has(s.iso) || bookedLabels.has(s.label);
                return (
                  <li key={s.iso} className="flex items-start gap-1.5">
                    <span
                      className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${picked ? "bg-chart-emerald" : "bg-muted-foreground/40"}`}
                      aria-hidden
                    />
                    <span className={picked ? "font-semibold text-foreground" : "text-foreground"}>
                      {s.label}
                      {picked && <span className="ml-1.5 font-medium text-chart-emerald">picked</span>}
                      {s.reason && <span className="text-muted-foreground"> — {s.reason}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            slotCalls.length > 0 && !failures.some((t) => t.name === "get_available_slots") && (
              <p className="text-muted-foreground">No ranked shortlist came back for this search.</p>
            )
          )}

          {otherTools.length > 0 && (
            <p className="text-muted-foreground/80">
              Also ran: <span className="font-mono text-[10px]">{otherTools.join(", ")}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Every booking the assistant pencilled in this reply, each with Confirm, plus Confirm all. */
export default function BookingProposalCard({ bookings, onResolved, bare, tools }: Props) {
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
      const { alreadyBooked, rescheduled } = await confirmPending(b);
      if (!quiet) showSuccess(alreadyBooked ? `${b.client_name} was already booked for ${fmtMelbourne(b.start_iso)}.` : rescheduled ? `Moved ${b.client_name} to ${fmtMelbourne(b.start_iso)}.` : `Booked ${b.client_name} for ${fmtMelbourne(b.start_iso)}.`);
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
                {b.reschedule_uid ? (
                  <p className="text-muted-foreground">
                    {b.reschedule_from ? <><span className="line-through">{fmtMelbourne(b.reschedule_from)}</span> → </> : "Move to "}
                    <span className="font-medium text-foreground">{fmtMelbourne(b.start_iso)}</span>
                  </p>
                ) : (
                  <p className="text-muted-foreground">{fmtMelbourne(b.start_iso)}</p>
                )}
                {b.notes && <p className="text-xs text-muted-foreground mt-0.5">{b.notes}</p>}
              </div>
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => discard(b)} disabled={busy}>
                  <X className="h-4 w-4 mr-1" /> Discard
                </Button>
                <Button size="sm" variant={bookings.length > 1 ? "outline" : "default"} onClick={() => confirmOne(b)} disabled={busy}
                  className={bookings.length > 1 ? "" : "bg-chart-emerald hover:bg-chart-emerald/90"}>
                  {rowBusy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                  {b.reschedule_uid ? "Confirm move" : "Confirm"}
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

      {tools && tools.length > 0 && <SlotEvidence tools={tools} bookings={bookings} bare={bare} />}
    </div>
  );
}
