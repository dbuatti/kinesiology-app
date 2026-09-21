import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { PendingBooking } from "@/types/assistant";
import { CalendarPlus, Check, Loader2, X, Mic, Brain } from "lucide-react";

interface Props {
  booking: PendingBooking;
  onConfirmed: () => void;
  onDiscard: () => void;
}

function fmtMelbourne(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "Australia/Melbourne" });
  const time = d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Melbourne" });
  return `${date} at ${time}`;
}

// The only place in the frontend that actually creates a booking — mirrors
// DraftEmailCard: the model can only propose, this Confirm click is what makes it real.
export default function BookingProposalCard({ booking, onConfirmed, onDiscard }: Props) {
  const [isBooking, setIsBooking] = useState(false);

  const isVoice = !!booking.voice_student_email;

  const handleConfirm = async () => {
    setIsBooking(true);
    try {
      // Mirrors useBookingProposals.confirmProposal's kind branch exactly — the
      // Timetable Simulator already confirms voice bookings this way, so this
      // reuses the same, already-live path rather than inventing a new one.
      const { data, error } = isVoice
        ? await supabase.functions.invoke("voice-create-booking", {
            body: {
              studentName: booking.client_name,
              studentEmail: booking.voice_student_email,
              startTime: booking.start_iso,
              eventTypeId: booking.event_type_id || undefined,
              notes: booking.notes || undefined,
            },
          })
        : await supabase.functions.invoke("create-calcom-booking", {
            body: {
              clientId: booking.client_id,
              startTime: booking.start_iso,
              eventTypeId: booking.event_type_id || undefined,
              title: `${booking.client_name} - Kinesiology`,
              notes: booking.notes || undefined,
            },
          });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Booking failed.");
      const uid = isVoice ? (data?.uid || data?.data?.data?.id || data?.booking?.uid) : data.uid;
      if (isVoice && !uid) throw new Error("Voice booking failed (no uid).");

      // Mirror useBookingProposals' confirmProposal exactly, so this shows as
      // confirmed on the Timetable Simulator too, not just in this chat.
      if (booking.proposal_id) {
        await supabase.from("booking_proposals").update({
          status: "confirmed",
          calcom_booking_id: String(uid),
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", booking.proposal_id);
      }

      showSuccess(`Booked ${booking.client_name} for ${fmtMelbourne(booking.start_iso)}.`);
      onConfirmed();
    } catch (err: any) {
      showError(err.message || "Failed to create the booking.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleDiscard = async () => {
    if (booking.proposal_id) {
      await supabase.from("booking_proposals").update({ status: "dropped", updated_at: new Date().toISOString() }).eq("id", booking.proposal_id);
    }
    onDiscard();
  };

  return (
    <Card className="border-chart-emerald/40 bg-chart-emerald/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-chart-emerald">
          <CalendarPlus className="h-4 w-4" /> Proposed booking — not confirmed yet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-xl bg-background/50 p-3 text-sm">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            {isVoice ? <Mic className="h-3.5 w-3.5 text-chart-destructive" /> : <Brain className="h-3.5 w-3.5 text-chart-purple" />}
            {booking.client_name}
          </p>
          <p className="text-muted-foreground">{fmtMelbourne(booking.start_iso)}</p>
          {booking.notes && <p className="text-xs text-muted-foreground mt-1">{booking.notes}</p>}
        </div>
        {booking.proposal_id && (
          <p className="text-[10px] text-muted-foreground">Pencilled into the Timetable Simulator too — visible there until confirmed or discarded.</p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={isBooking}>
            <X className="h-4 w-4 mr-1" /> Discard
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={isBooking} className="bg-chart-emerald hover:bg-chart-emerald/90">
            {isBooking ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
            Confirm booking
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
