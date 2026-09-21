import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { voiceStudentIdFor, isVoiceStudentId } from "@/lib/voice-student-id";
import { computeClientLifecycleStatus, LifecycleStatus } from "@/lib/clientStatus";
import ClientLifecycleBadge from "@/components/crm/ClientLifecycleBadge";
import { AlertCircle, ChevronDown, ChevronUp, Mail, MessageCircle, Loader2, Mic, Brain } from "lucide-react";

// The ONE follow-up surface in the app (see src/lib/clientStatus.ts) — this used
// to disagree with FollowUpPage.tsx (a separate route, since deleted) and
// ClientsPage.tsx's own attention_score. All three now share one definition.
const STATUS_RANK: Record<LifecycleStatus, number> = { active: 0, at_risk: 1, lapsed: 2, lead: 3 };

interface AttentionClient {
  id: string; // client uuid, or voiceStudentIdFor(email) pseudo-id
  kind: "kinesiology" | "voice";
  name: string;
  email: string | null;
  status: LifecycleStatus;
  reason: string;
  daysSinceLast: number | null;
}

async function fetchKinesiologyAttention(): Promise<AttentionClient[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("client_id, date, status, clients(id, name, email)")
    .order("date", { ascending: false });
  if (error || !data) return [];

  const now = new Date();
  const hasFuture = new Set<string>();
  const agg = new Map<string, { client: { name: string | null; email: string | null }; appointments: { date: string; status: string }[] }>();

  type AppointmentRow = { client_id: string | null; date: string; status: string; clients: { name: string | null; email: string | null } | null };
  for (const a of data as unknown as AppointmentRow[]) {
    if (!a.client_id || !a.clients) continue;
    const d = new Date(a.date);
    if (a.status === "Scheduled" && d > now) {
      hasFuture.add(a.client_id);
      continue;
    }
    if (d > now) continue;
    const existing = agg.get(a.client_id) || { client: a.clients, appointments: [] };
    existing.appointments.push({ date: a.date, status: a.status });
    agg.set(a.client_id, existing);
  }

  const results: AttentionClient[] = [];
  for (const [clientId, { client, appointments }] of agg.entries()) {
    if (hasFuture.has(clientId)) continue;
    const { status, reason, daysSinceLast } = computeClientLifecycleStatus({ appointments, hasFutureBooking: false });
    if (status === "lead") continue;
    results.push({ id: clientId, kind: "kinesiology", name: client.name || "Unknown", email: client.email || null, status, reason, daysSinceLast });
  }
  return results;
}

async function fetchVoiceAttention(): Promise<AttentionClient[]> {
  const { data, error } = await supabase
    .from("voice_bookings")
    .select("student_name, student_email, lesson_date, status")
    .not("student_email", "is", null)
    .order("lesson_date", { ascending: false });
  if (error || !data) return [];

  const now = new Date();
  const hasFuture = new Set<string>();
  const agg = new Map<string, { name: string; email: string; appointments: { date: string; status: string }[] }>();

  type VoiceBookingRow = { student_name: string | null; student_email: string | null; lesson_date: string; status: string | null };
  for (const b of data as VoiceBookingRow[]) {
    const email = String(b.student_email || "").toLowerCase().trim();
    if (!email) continue;
    const d = new Date(b.lesson_date);
    if (isNaN(d.getTime())) continue;
    const isCancelled = b.status === "cancelled";
    if (!isCancelled && d > now) {
      hasFuture.add(email);
      continue;
    }
    if (d > now) continue;
    const existing = agg.get(email) || { name: b.student_name || "Unknown", email, appointments: [] };
    existing.appointments.push({ date: b.lesson_date, status: isCancelled ? "Cancelled" : "Completed" });
    agg.set(email, existing);
  }

  const results: AttentionClient[] = [];
  for (const [email, { name, appointments }] of agg.entries()) {
    if (hasFuture.has(email)) continue;
    const { status, reason, daysSinceLast } = computeClientLifecycleStatus({ appointments, hasFutureBooking: false });
    if (status === "lead") continue;
    results.push({ id: voiceStudentIdFor(email), kind: "voice", name, email, status, reason, daysSinceLast });
  }
  return results;
}

async function fetchNeedsAttention(): Promise<AttentionClient[]> {
  const [kinesiology, voice] = await Promise.all([fetchKinesiologyAttention(), fetchVoiceAttention()]);
  return [...kinesiology, ...voice].sort((a, b) => {
    const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (rankDiff !== 0) return rankDiff;
    return (a.daysSinceLast ?? 0) - (b.daysSinceLast ?? 0);
  });
}

function assistantPrompt(c: AttentionClient) {
  const firstName = c.name.split(" ")[0];
  switch (c.status) {
    case "active":
      return `Find a good slot and book ${firstName}'s next session — check their availability notes and usual pattern first.`;
    case "at_risk":
      return `${firstName}: ${c.reason}. Help me draft a friendly, no-pressure follow-up.`;
    default:
      return `${firstName} has been quiet for a while (${c.reason.toLowerCase()}). Help me draft a warm check-in to see if they'd like to come back.`;
  }
}

export default function NeedsAttentionWidget() {
  const [clients, setClients] = useState<AttentionClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setClients(await fetchNeedsAttention());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking who needs follow-up...
      </div>
    );
  }

  if (clients.length === 0) return null;

  const shown = showAll ? clients : clients.slice(0, 12);
  const counts = clients.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {} as Record<LifecycleStatus, number>);

  return (
    <div className="rounded-2xl border border-border bg-card mb-4 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <AlertCircle className="h-4 w-4 text-chart-destructive" />
          Needs follow-up
          <span className="text-[10px] font-black uppercase tracking-wider text-chart-destructive bg-chart-destructive/10 px-1.5 py-0.5 rounded-full">
            {clients.length}
          </span>
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 -mt-1">
          <p className="text-[11px] text-muted-foreground mb-3">
            {(["active", "at_risk", "lapsed"] as LifecycleStatus[])
              .filter((s) => counts[s])
              .map((s) => `${counts[s]} ${s === "active" ? "worth rebooking" : s === "at_risk" ? "at risk" : "lapsed"}`)
              .join(" · ")}
            {" "}— kinesiology and voice, most worth reaching out to first.
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {shown.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-2 rounded-xl border border-border p-3 shrink-0 w-[210px] bg-card"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {c.kind === "voice"
                      ? <Mic className="h-3 w-3 text-chart-destructive shrink-0" />
                      : <Brain className="h-3 w-3 text-chart-purple shrink-0" />}
                    {isVoiceStudentId(c.id) ? (
                      <span className="text-sm font-semibold text-foreground truncate">{c.name}</span>
                    ) : (
                      <Link to={`/clients/${c.id}`} className="text-sm font-semibold text-foreground hover:text-primary truncate no-underline">
                        {c.name}
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <ClientLifecycleBadge status={c.status} />
                  </div>
                  <p className="text-[10px] text-muted-foreground opacity-80 mt-1 leading-snug">{c.reason}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button asChild size="sm" variant="secondary" className="h-7 flex-1 text-[10px] gap-1 px-2">
                    <Link to={`/assistant?client=${encodeURIComponent(c.id)}&prompt=${encodeURIComponent(assistantPrompt(c))}`}>
                      <MessageCircle className="h-3 w-3" /> {c.status === "active" ? "Book" : "Assistant"}
                    </Link>
                  </Button>
                  {c.email && (
                    <Button asChild size="sm" variant="outline" className="h-7 w-7 p-0 shrink-0">
                      <Link to={`/assistant?client=${encodeURIComponent(c.id)}&view=email`} title={`Email ${c.name} (in-app, threaded)`}><Mail className="h-3 w-3" /></Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {clients.length > shown.length && (
            <button onClick={() => setShowAll(true)} className="text-[11px] text-primary hover:underline mt-2 inline-block">
              Show all {clients.length} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
