import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { CALCOM_CONFIG } from "@/config/integrations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2, CalendarPlus, LogOut, Send, X, Mail, ExternalLink } from "lucide-react";

type Service = "fnh" | "voice";
const SERVICE_EVENT_TYPE_ID: Record<Service, number> = { fnh: 4279898, voice: 1945081 };
const SERVICE_LABEL: Record<Service, string> = { fnh: "FNH session", voice: "voice/piano lesson" };

interface MyAppointment {
  id: string;
  date: string;
  tag: string;
  status: string;
  next_session_note: string | null;
  calcom_booking_id: string | null;
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "Australia/Melbourne" }) +
    " · " + d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Melbourne" });
}

export default function ClientPortalPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [appointments, setAppointments] = useState<MyAppointment[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [slots, setSlots] = useState<{ iso: string; label: string }[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLinkError(null);
    try {
      const { data: linkData, error: linkErr } = await supabase.functions.invoke("client-portal-link-account", { body: {} });
      if (linkErr || linkData?.error) throw new Error(linkData?.error || linkErr?.message);

      const [{ data: profileData, error: profileErr }, { data: apptData, error: apptErr }] = await Promise.all([
        supabase.rpc("get_my_client_profile"),
        supabase.rpc("get_my_appointments"),
      ]);
      if (profileErr) throw profileErr;
      if (apptErr) throw apptErr;

      setProfile(profileData?.[0] || null);
      setAppointments(apptData || []);
    } catch (err: any) {
      setLinkError(err.message || "Couldn't load your portal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (appt: MyAppointment) => {
    if (!appt.calcom_booking_id) { showError("This session can't be cancelled online — please message Daniele."); return; }
    if (!confirm(`Cancel your session on ${fmtDate(appt.date)}?`)) return;
    setCancellingId(appt.id);
    try {
      const { data, error } = await supabase.functions.invoke("client-cancel-booking", { body: { bookingUid: appt.calcom_booking_id } });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      showSuccess("Session cancelled.");
      await load();
    } catch (err: any) {
      showError(err.message || "Couldn't cancel that session.");
    } finally {
      setCancellingId(null);
    }
  };

  const openPicker = async (service: Service) => {
    setBookingService(service);
    setSlots(null);
    setLoadingSlots(true);
    try {
      const windowsToTry = [14, 45, 90];
      let flat: { iso: string; label: string }[] = [];
      for (const days of windowsToTry) {
        const start = new Date();
        const end = new Date(); end.setDate(end.getDate() + days);
        const { data, error } = await supabase.functions.invoke("client-get-slots", {
          body: { start: start.toISOString(), end: end.toISOString(), eventTypeId: SERVICE_EVENT_TYPE_ID[service], timeZone: "Australia/Melbourne" },
        });
        if (error || data?.error) throw new Error(data?.error || error?.message);
        flat = [];
        for (const isoList of Object.values<string[]>(data.slots || {})) {
          for (const iso of isoList) {
            const d = new Date(iso);
            const label = d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "Australia/Melbourne" }) +
              " " + d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Melbourne" });
            flat.push({ iso, label });
          }
          if (flat.length >= 12) break;
        }
        if (flat.length > 0) break;
      }
      setSlots(flat.slice(0, 12));
      if (flat.length === 0) showError("No open slots found in the next 90 days.");
    } catch (err: any) {
      showError(err.message || "Couldn't load available times.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookSlot = async (iso: string) => {
    if (!bookingService) return;
    setBookingSlot(iso);
    try {
      const { data, error } = await supabase.functions.invoke("client-create-booking", {
        body: { startTime: iso, eventTypeId: SERVICE_EVENT_TYPE_ID[bookingService] },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      showSuccess(`Your ${SERVICE_LABEL[bookingService]} is booked!`);
      setBookingService(null);
      setSlots(null);
      await load();
    } catch (err: any) {
      showError(err.message || "Couldn't book that time.");
    } finally {
      setBookingSlot(null);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setSendingMessage(true);
    try {
      const { data, error } = await supabase.functions.invoke("client-send-message", { body: { message } });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      showSuccess("Message sent to Daniele.");
      setMessage("");
    } catch (err: any) {
      showError(err.message || "Couldn't send that message.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/portal/login";
  };

  if (session === undefined) {
    return <div className="min-h-screen flex items-center justify-center bg-muted"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (session === null) return <Navigate to="/portal/login" replace />;

  const upcoming = appointments.filter((a) => a.status === "Scheduled");
  const past = appointments.filter((a) => a.status === "Completed");
  const firstName = profile?.name?.split(" ")[0] || "";

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-background border-b border-border px-6 py-5 flex items-center justify-between max-w-3xl mx-auto">
        <div>
          <div className="text-lg font-serif font-bold text-foreground">✦ Resonance Kinesiology</div>
          {profile && <div className="text-sm text-muted-foreground mt-0.5">Welcome back, {firstName}</div>}
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 text-xs">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </Button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : linkError ? (
          <div className="bg-background rounded-2xl border border-border p-8 text-center space-y-3">
            <p className="text-foreground font-semibold">{linkError}</p>
            <p className="text-sm text-muted-foreground">If you've booked with Daniele before, make sure you're using the same email address. Otherwise, get in touch and he'll sort it out.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="h-12 rounded-xl font-bold gap-2 flex-1" onClick={() => openPicker("fnh")} disabled={loadingSlots && bookingService === "fnh"}>
                {loadingSlots && bookingService === "fnh" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />} Book an FNH session
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-xl font-bold gap-2 flex-1" onClick={() => openPicker("voice")} disabled={loadingSlots && bookingService === "voice"}>
                {loadingSlots && bookingService === "voice" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />} Book a lesson
              </Button>
            </div>

            {bookingService && (
              <section className="bg-background rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Pick a time — {SERVICE_LABEL[bookingService]}</h2>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setBookingService(null); setSlots(null); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {loadingSlots ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : slots && slots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.iso}
                        onClick={() => handleBookSlot(s.iso)}
                        disabled={bookingSlot !== null}
                        className="rounded-xl border border-border bg-muted/50 hover:bg-muted px-3 py-2.5 text-xs font-semibold text-foreground transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {bookingSlot === s.iso && <Loader2 className="h-3 w-3 animate-spin" />} {s.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No open times found.</p>
                )}
                <a
                  href={bookingService === "fnh" ? CALCOM_CONFIG.BOOKING_URL : CALCOM_CONFIG.VOICE_COACHING_URL}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 w-fit"
                >
                  <ExternalLink className="h-3 w-3" /> Or book directly on Cal.com
                </a>
              </section>
            )}

            <section className="bg-background rounded-2xl border border-border p-6">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-4">Upcoming sessions</h2>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing booked right now.</p>
              ) : (
                <div className="space-y-2">
                  {upcoming.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{a.tag}</div>
                        <div className="text-xs text-muted-foreground">{fmtDate(a.date)}</div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive gap-1" onClick={() => handleCancel(a)} disabled={cancellingId === a.id}>
                        {cancellingId === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />} Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-background rounded-2xl border border-border p-6">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-4">Past sessions</h2>
              {past.length === 0 ? (
                <p className="text-sm text-muted-foreground">No past sessions yet.</p>
              ) : (
                <div className="space-y-2">
                  {past.map((a) => (
                    <div key={a.id} className="rounded-xl bg-muted/50 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-foreground">{a.tag}</div>
                        <div className="text-xs text-muted-foreground">{fmtDate(a.date)}</div>
                      </div>
                      {a.next_session_note && (
                        <p className="text-xs text-muted-foreground mt-1.5 italic">"{a.next_session_note}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-background rounded-2xl border border-border p-6">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Message Daniele
              </h2>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                rows={3}
                className="resize-none text-base md:text-sm mb-3"
                disabled={sendingMessage}
              />
              <Button onClick={handleSendMessage} disabled={sendingMessage || !message.trim()} className="gap-1.5">
                {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
              </Button>
              <p className="text-[11px] text-muted-foreground mt-2">This lands directly in Daniele's inbox — he'll reply to your email.</p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
