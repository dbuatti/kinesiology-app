import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2, LayoutGrid, List, Users, AlertCircle, RefreshCw, TrendingUp, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import HubTabs from "@/components/shared/HubTabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ClientForm from "@/components/crm/ClientForm";
import AppointmentForm from "@/components/crm/AppointmentForm";
import { Client } from "@/types/crm";
import AppLayout from "@/components/crm/AppLayout";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import ClientTableView from "@/components/crm/ClientTableView";
import ClientGridView from "@/components/crm/ClientGridView";
import { ClinicalOversightTool } from "@/pages/ClinicalOversightPage";
import { computeClientLifecycleStatus, LifecycleStatus } from "@/lib/clientStatus";
import { fetchNormalizedVoiceBookings } from "@/lib/voiceBookings";
import { voiceStudentIdFor } from "@/lib/voice-student-id";

interface ClientWithStats extends Client {
  // "This whole tool must always be for voice, piano, and kinesiology" — the
  // Client Database used to be kinesiology-only (voice students had their
  // own separate list under Voice Studio), which was the actual bug being
  // reported: one unified list, distinguished per-row, same convention
  // already used in Follow-up/Launch Campaign (Mic vs Brain icon).
  kind: "kinesiology" | "voice";
  // Which practice: voice rows split into voice / piano by their latest lesson.
  practice: Practice;
  session_count: number;
  last_session_at: string | null;
  last_contacted_at: string | null;
  latest_bolt: number | null;
  upcoming_count: number;
  activity_score: number;
  lifecycle_status: LifecycleStatus;
  lifecycle_status_reason: string;
}

type Practice = "kinesiology" | "voice" | "piano";
const PRACTICE_LABEL: Record<Practice | "all", string> = { all: "Everyone", kinesiology: "Kinesiology", voice: "Voice", piano: "Piano" };

const STATUS_RANK: Record<LifecycleStatus, number> = { at_risk: 0, active: 1, lapsed: 2, lead: 3 };

export function ClientsTool() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'attention' | 'active' | 'name' | 'recent' | 'upcoming'>('attention');
  // One-time read (not a live useSearchParams subscription) so a deep link from
  // the Assistant's Key Metrics pipeline tile (e.g. /clients?status=at_risk) can
  // pre-select a filter without this page's own state fighting a live param.
  const [statusFilter, setStatusFilter] = useState<LifecycleStatus | 'all'>(() => {
    const s = new URLSearchParams(window.location.search).get('status');
    return (s === 'lead' || s === 'active' || s === 'at_risk' || s === 'lapsed') ? s : 'all';
  });
  const [practiceFilter, setPracticeFilter] = useState<Practice | 'all'>(() => {
    const p = new URLSearchParams(window.location.search).get('practice');
    return (p === 'kinesiology' || p === 'voice' || p === 'piano') ? p : 'all';
  });
  const navigate = useNavigate();
  const { isPrivate } = usePrivacyMode();
  
  const fetchKinesiologyClients = async (): Promise<ClientWithStats[]> => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, appointments(date, bolt_score, status)')
        .contains("practices", ["kinesiology"])
        .or('is_practitioner.eq.false,is_practitioner.is.null')
        .order('name', { ascending: true });

      if (error) throw error;
      
      const mapped = (data || []).map(c => {
        const activeApps = (c.appointments || []).filter((a: any) => a.status !== 'Cancelled');
        const sortedApps = [...activeApps]
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const latestBoltApp = (c.appointments || [])
          .filter((a: any) => a.bolt_score !== null)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        const now = Date.now();
        const pastApps = activeApps.filter((a: any) => {
          const t = a.date ? new Date(a.date).getTime() : NaN;
          return !isNaN(t) && t < now;
        });
        const upcomingApps = activeApps.filter((a: any) => {
          const t = a.date ? new Date(a.date).getTime() : NaN;
          return !isNaN(t) && t >= now;
        });

        const lastMs = sortedApps.length > 0 && sortedApps[0].date
          ? new Date(sortedApps[0].date).getTime()
          : null;

        // Active-window frequency (last 180 days).
        const recentCount = pastApps.filter((a: any) => {
          const t = a.date ? new Date(a.date).getTime() : NaN;
          return !isNaN(t) && t >= now - 180 * 24 * 60 * 60 * 1000;
        }).length;

        // Recency points: within 30d = 50, 60d = 40, 90d = 28, 180d = 16, else 0.
        let recencyPts = 0;
        if (lastMs != null) {
          const days = (now - lastMs) / (24 * 60 * 60 * 1000);
          if (days <= 30) recencyPts = 50;
          else if (days <= 60) recencyPts = 40;
          else if (days <= 90) recencyPts = 28;
          else if (days <= 180) recencyPts = 16;
        }
        // Frequency points: cap at 12+ sessions in the window = 50.
        const freqPts = Math.min(50, recentCount * 5);
        const upcomingCount = upcomingApps.length;

        const { status: lifecycle_status, reason: lifecycle_status_reason } = computeClientLifecycleStatus({
          appointments: (c.appointments || []).map((a: any) => ({ date: a.date, status: a.status })),
          hasFutureBooking: upcomingCount > 0,
          manualOverride: (c as any).lifecycle_status_manual ? (c as any).lifecycle_status : null,
        });

        return {
          ...c,
          kind: "kinesiology",
          practice: "kinesiology",
          born: c.born ? new Date(c.born) : null,
          suburbs: c.suburbs || [],
          session_count: pastApps.length,
          last_session_at: sortedApps.length > 0 ? sortedApps[0].date : null,
          latest_bolt: latestBoltApp ? latestBoltApp.bolt_score : null,
          upcoming_count: upcomingCount,
          activity_score: recencyPts + freqPts,
          lifecycle_status,
          lifecycle_status_reason,
        };
      }) as unknown as ClientWithStats[];

      return mapped;
  };

  // Same "kept in sync" scoring convention as the kinesiology branch above —
  // deliberately reuses fetchNormalizedVoiceBookings (already merges
  // Cal.com + Notion-only lessons, see src/lib/voiceBookings.ts) so a voice
  // student's real history shows up here exactly as it does everywhere else
  // in the app, not a second, divergent computation.
  const fetchVoiceClients = async (): Promise<ClientWithStats[]> => {
    const bookings = await fetchNormalizedVoiceBookings();
    const now = Date.now();
    const agg = new Map<string, { name: string; email: string; practice: Practice; appointments: { date: string; status: string }[] }>();
    // Bookings arrive newest first, so the first one seen sets the student's practice.
    for (const b of bookings) {
      const existing = agg.get(b.studentEmail) || { name: b.studentName, email: b.studentEmail, practice: b.discipline, appointments: [] };
      existing.appointments.push({ date: b.lessonDate, status: b.status === "cancelled" ? "Cancelled" : "Completed" });
      agg.set(b.studentEmail, existing);
    }

    const results: ClientWithStats[] = [];
    for (const [email, { name, practice, appointments }] of agg.entries()) {
      const activeApps = appointments.filter((a) => a.status !== "Cancelled");
      const pastApps = activeApps.filter((a) => new Date(a.date).getTime() < now);
      const upcomingApps = activeApps.filter((a) => new Date(a.date).getTime() >= now);
      const sortedPast = [...pastApps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastMs = sortedPast[0] ? new Date(sortedPast[0].date).getTime() : null;
      const recentCount = pastApps.filter((a) => new Date(a.date).getTime() >= now - 180 * 24 * 60 * 60 * 1000).length;
      let recencyPts = 0;
      if (lastMs != null) {
        const days = (now - lastMs) / (24 * 60 * 60 * 1000);
        if (days <= 30) recencyPts = 50;
        else if (days <= 60) recencyPts = 40;
        else if (days <= 90) recencyPts = 28;
        else if (days <= 180) recencyPts = 16;
      }
      const freqPts = Math.min(50, recentCount * 5);

      const { status: lifecycle_status, reason: lifecycle_status_reason } = computeClientLifecycleStatus({
        appointments: pastApps,
        hasFutureBooking: upcomingApps.length > 0,
      });

      results.push({
        id: voiceStudentIdFor(email),
        kind: "voice",
        practice,
        name, email, phone: null, born: null, suburbs: [],
        standard_rate: null, target_rate: null,
        onboarding_submitted_at: null, stripe_customer_id: null,
        session_count: pastApps.length,
        last_session_at: sortedPast[0]?.date || null,
        latest_bolt: null,
        upcoming_count: upcomingApps.length,
        activity_score: recencyPts + freqPts,
        lifecycle_status,
        lifecycle_status_reason,
      } as unknown as ClientWithStats);
    }
    return results;
  };

  // Session recency ("Last Session") only tells half the story — a client
  // can look quiet on sessions while actually corresponding by email
  // regularly, or the reverse. Not shown anywhere in this list before.
  //
  // Deliberately NOT sourced from `email_log` (the table the assistant's own
  // draft-send flow writes to) — checked live and it's completely empty, no
  // rows ever, since that flow hasn't been used for a real send yet. That
  // would have made this column show "Never" for all 66 clients, which is
  // worse than not having it. Reuses gmail-list-client-inbox instead (same
  // one bulk call CommsInbox already makes) — real, populated data today,
  // though it only sees INBOUND messages within the last 90 days, so this
  // reads as "last heard from them", not a full bidirectional contact log.
  const fetchLastContactedMap = async (): Promise<Map<string, string>> => {
    const map = new Map<string, string>();
    const { data } = await supabase.functions.invoke("gmail-list-client-inbox");
    for (const m of (data?.messages || []) as { email: string; date_iso: string }[]) {
      const key = (m.email || "").toLowerCase();
      const existing = map.get(key);
      if (!existing || new Date(m.date_iso) > new Date(existing)) map.set(key, m.date_iso);
    }
    return map;
  };

  const loadAllClients = async () => {
    setLoading(true);
    try {
      const [kinesiology, voice] = await Promise.all([fetchKinesiologyClients(), fetchVoiceClients()]);
      const all = [...kinesiology, ...voice];
      const contactedMap = await fetchLastContactedMap();
      setClients(all.map((c) => ({ ...c, last_contacted_at: c.email ? contactedMap.get(c.email.toLowerCase()) || null : null })));
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError("Failed to load clients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllClients();
  }, []);

  const handleQuickBook = (clientId: string) => {
    setSelectedClientId(clientId);
    setBookOpen(true);
  };

  const filteredClients = clients
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.suburbs.some(s => s.toLowerCase().includes(search.toLowerCase()))
    )
    .filter(c => statusFilter === 'all' || c.lifecycle_status === statusFilter)
    .filter(c => practiceFilter === 'all' || c.practice === practiceFilter)
    .sort((a, b) => {
      if (sortBy === 'attention') return STATUS_RANK[a.lifecycle_status] - STATUS_RANK[b.lifecycle_status];
      if (sortBy === 'active') return b.activity_score - a.activity_score;
      if (sortBy === 'recent') return (b.last_session_at ? new Date(b.last_session_at).getTime() : 0) - (a.last_session_at ? new Date(a.last_session_at).getTime() : 0);
      if (sortBy === 'upcoming') return b.upcoming_count - a.upcoming_count;
      return a.name.localeCompare(b.name);
    });

  return (
    <>
      <div className="flex flex-col gap-8">
        <PageHeader 
          title="People"
          subtitle="Clients and students across kinesiology, voice and piano."
          icon={Users}
          actions={
            <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-medium" onClick={() => navigate('/voice/clients/new')}>
              <Plus size={15} /> New student
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-medium shadow-sm">
                  <Plus size={15} /> New client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] rounded-2xl p-0 overflow-hidden">
                <div className="p-8">
                  <DialogHeader className="mb-6">
                    <DialogTitle className="text-xl font-serif font-medium tracking-tight">New client</DialogTitle>
                    <DialogDescription className="font-medium">Create a new client profile in your clinical database.</DialogDescription>
                  </DialogHeader>
                  <ClientForm onSuccess={() => { setOpen(false); loadAllClients(); }} />
                </div>
              </DialogContent>
            </Dialog>
            </div>
          }
        />

        {/* One toolbar: search · lifecycle filter · sort · view */}
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
          <div className="relative w-full 2xl:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input
              placeholder="Search name, email or suburb…"
              className="h-9 rounded-lg border-border bg-card pl-9 text-[13px] shadow-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1">
            {(['all', 'lead', 'active', 'at_risk', 'lapsed'] as const).map((s) => {
              const count = s === 'all' ? clients.length : clients.filter(c => c.lifecycle_status === s).length;
              const label = s === 'all' ? 'All' : s === 'at_risk' ? 'At risk' : s.charAt(0).toUpperCase() + s.slice(1);
              const on = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium",
                    on ? "bg-foreground/[0.07] text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                  )}
                >
                  {label}
                  <span className={cn("tabular-nums text-xs", on ? "text-foreground/60" : "text-muted-foreground/60")}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 2xl:ml-auto">
            <Select value={practiceFilter} onValueChange={(v) => setPracticeFilter(v as typeof practiceFilter)}>
              <SelectTrigger className="h-8 w-auto shrink-0 gap-1.5 rounded-lg border-border bg-card px-2.5 text-[13px] font-medium shadow-xs" aria-label="Filter by practice">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {(['all', 'kinesiology', 'voice', 'piano'] as const).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRACTICE_LABEL[p]} <span className="ml-1 text-muted-foreground tabular-nums">{p === 'all' ? clients.length : clients.filter(c => c.practice === p).length}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="h-8 w-auto shrink-0 gap-1.5 rounded-lg border-border bg-card px-2.5 text-[13px] font-medium shadow-xs">
                <ArrowUpDown size={13} className="text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="attention">Needs attention</SelectItem>
                <SelectItem value="active">Most active</SelectItem>
                <SelectItem value="recent">Recently seen</SelectItem>
                <SelectItem value="upcoming">Most upcoming</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5 shadow-xs">
              {([['table', List, 'Table'], ['grid', LayoutGrid, 'Grid']] as const).map(([v, Icon, label]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  aria-label={`${label} view`}
                  title={`${label} view`}
                  className={cn(
                    "flex h-7 w-8 items-center justify-center rounded-md",
                    view === v ? "bg-foreground/[0.07] text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle size={28} className="text-destructive" />
            </div>
            <p className="text-destructive font-semibold text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={() => { setError(null); setLoading(true); loadAllClients(); }} className="rounded-xl text-xs gap-2">
              <RefreshCw size={14} /> Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-border px-6 py-4 last:border-0">
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-56 animate-pulse rounded bg-muted/70" />
                </div>
                <div className="hidden h-3 w-24 animate-pulse rounded bg-muted sm:block" />
              </div>
            ))}
          </div>
        ) : filteredClients.length > 0 ? (
          view === 'table' ? (
            <ClientTableView 
              clients={filteredClients} 
              isPrivate={isPrivate} 
              onQuickBook={handleQuickBook} 
            />
          ) : (
            <ClientGridView 
              clients={filteredClients} 
              isPrivate={isPrivate} 
              onQuickBook={handleQuickBook} 
            />
          )
        ) : clients.length === 0 ? (
          <div className="text-center py-32 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
            <div className="mx-auto w-20 h-20 bg-card rounded-3xl flex items-center justify-center mb-6 shadow-xl">
               <Users className="text-muted-foreground" size={32} />
            </div>
            <p className="text-foreground font-semibold text-xl">No clients yet</p>
            <p className="text-muted-foreground mt-2 mb-8 font-medium">Add your first client to start building your clinical database.</p>
            <Button className="h-12 px-8 bg-primary hover:bg-primary/90 rounded-2xl font-bold text-primary-foreground" onClick={() => setOpen(true)}>
              <Plus size={18} className="mr-2" /> Add First Client
            </Button>
          </div>
        ) : (
          <div className="text-center py-32 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
            <div className="mx-auto w-20 h-20 bg-card rounded-3xl flex items-center justify-center mb-6 shadow-xl">
               <Search className="text-muted-foreground" size={32} />
            </div>
            <p className="text-foreground font-semibold text-xl">No clients match "{search}"</p>
            <p className="text-muted-foreground mt-2 mb-8 font-medium">Try a different name, email, or suburb.</p>
            <Button variant="outline" className="h-12 px-8 border-border hover:bg-card rounded-2xl font-bold" onClick={() => { setSearch(""); }}>Clear Search</Button>
          </div>
        )}
      </div>

      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl p-0 overflow-hidden">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-semibold">Quick Book Session</DialogTitle>
              <DialogDescription className="font-medium">Schedule a new appointment for this client.</DialogDescription>
            </DialogHeader>
            {selectedClientId && <AppointmentForm initialClientId={selectedClientId} onSuccess={() => { setBookOpen(false); loadAllClients(); }} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const ClientsPage = () => {
  const [tab, setTab] = useState(() => {
    const tool = new URLSearchParams(window.location.search).get("tool");
    return tool === "oversight" ? "oversight" : "database";
  });

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <HubTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "database", label: "People", icon: Users },
          { id: "oversight", label: "Clinical oversight", icon: TrendingUp },
        ]}
      />
      <TabsContent value="database" className="m-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <ClientsTool />
        </div>
      </TabsContent>
      <TabsContent value="oversight" className="m-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <ClinicalOversightTool />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ClientsPage;