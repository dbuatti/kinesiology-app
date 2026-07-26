import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, DollarSign, Mic, Layers, ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import AppLayout from '@/components/crm/AppLayout';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/shared/PageLoader';

interface VoiceBooking {
  id: string; student_name: string | null; student_email: string | null;
  lesson_date: string; lesson_time: string | null;
  cost: number | null; duration: string | null; status: string; source?: string | null; discipline?: string | null;
}
interface KineAppt {
  id: string; client_id: string; date: string;
  price_amount: number | null; is_paid: boolean | null;
  payment_received: boolean | null; tag: string | null; status: string;
}
interface ClientRow {
  id: string; name: string; standard_rate: number | null; created_at: string | null;
}
type ViewFilter = 'all' | 'fnh' | 'voice';

const fmt = (n: number) => "$" + n.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const FILTERS: { key: ViewFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'fnh', label: 'FNH' },
  { key: 'voice', label: 'Voice' },
];

const INCLUDE_STATUSES = new Set(['paid', 'completed']);
const SCHEDULED_STATUSES = new Set(['scheduled']);

const SOURCE_COLORS: Record<string, string> = {
  fnh: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  voice: 'bg-rose-500/10 text-rose-600 border-rose-200',
  both: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
};

const BusinessOverviewPage = () => {
  const navigate = useNavigate();
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const now = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now]);
  const [practitionerEmail, setPractitionerEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setPractitionerEmail(data.user.email.toLowerCase());
    });
  }, []);

  const { data: voiceData } = useQuery({
    queryKey: ['biz-voice-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('voice_bookings').select('*');
      if (error) throw error;
      return (data || []) as VoiceBooking[];
    },
  });
  const { data: appointments } = useQuery({
    queryKey: ['biz-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, client_id, date, price_amount, is_paid, payment_received, tag, status');
      if (error) throw error;
      return (data || []) as KineAppt[];
    },
  });
  const { data: clients } = useQuery({
    queryKey: ['biz-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, standard_rate, created_at')
        .or('is_practitioner.eq.false,is_practitioner.is.null');
      if (error) throw error;
      return (data || []) as ClientRow[];
    },
  });

  const isLoading = !voiceData || !appointments || !clients;

  // ── Single-pass derived data ──
  const derived = useMemo(() => {
    if (!voiceData || !appointments || !clients) return null;

    const showKine = viewFilter !== 'voice';
    const filterSelf = (v: VoiceBooking) =>
      v.student_name && v.student_email &&
      (!practitionerEmail || v.student_email.toLowerCase() !== practitionerEmail);
    const filteredVoice = (viewFilter === 'all' ? voiceData
      : viewFilter === 'fnh' ? voiceData.filter(v => v.source === 'kine' || v.source === 'both')
      : voiceData.filter(v => !v.source || v.source === 'voice')).filter(filterSelf);

    const monthStr = monthStart.toISOString().slice(0, 7);

    // ── Kine stats ──
    let kineRevenue = 0, kineMonthRev = 0, paidKineCount = 0;

    if (showKine) {
      for (const a of appointments) {
        const paid = a.is_paid || a.payment_received;
        if (paid) {
          const amt = a.price_amount || 0;
          kineRevenue += amt;
          paidKineCount++;
          if (a.date >= monthStr) kineMonthRev += amt;
        }
      }
    }

    // ── Voice stats ──
    let voiceRevenue = 0, voiceMonthRev = 0, paidVoiceCount = 0, scheduledVoiceCount = 0;
    const voiceStudentSet = new Set<string>();

    for (const v of filteredVoice) {
      if (INCLUDE_STATUSES.has(v.status) || SCHEDULED_STATUSES.has(v.status)) {
        if (v.student_email) voiceStudentSet.add(v.student_email);
      }
      if (INCLUDE_STATUSES.has(v.status)) {
        const cost = v.cost || 0;
        voiceRevenue += cost;
        paidVoiceCount++;
        if (v.lesson_date && v.lesson_date >= monthStr) voiceMonthRev += cost;
      }
      if (SCHEDULED_STATUSES.has(v.status)) {
        scheduledVoiceCount++;
      }
    }

    // ── Client stats ──
    const cutoff90 = new Date(now); cutoff90.setDate(cutoff90.getDate() - 90);
    const cutoff30 = new Date(now); cutoff30.setDate(cutoff30.getDate() - 30);
    const activeClientIds = new Set<string>();
    let newClientCount = 0;

    if (showKine) {
      for (const a of appointments) {
        if (new Date(a.date) >= cutoff90) activeClientIds.add(a.client_id);
      }
      newClientCount = clients.filter(c => c.created_at && new Date(c.created_at) >= cutoff30).length;
    }

    // ── Source breakdown ──
    const srcCount: Record<string, { count: number; revenue: number }> = {};
    if (showKine) {
      srcCount.fnh = { count: paidKineCount, revenue: kineRevenue };
    }
    for (const v of filteredVoice) {
      if (!INCLUDE_STATUSES.has(v.status)) continue;
      const s = v.source || 'voice';
      if (srcCount[s]) { srcCount[s].count++; srcCount[s].revenue += v.cost || 0; }
      else { srcCount[s] = { count: 1, revenue: v.cost || 0 }; }
    }

    // ── Monthly breakdown ──
    const byMonth: Record<string, { kine: number; voice: number }> = {};
    if (showKine) {
      for (const a of appointments) {
        if (a.is_paid || a.payment_received) {
          const m = a.date.slice(0, 7);
          if (!byMonth[m]) byMonth[m] = { kine: 0, voice: 0 };
          byMonth[m].kine += a.price_amount || 0;
        }
      }
    }
    for (const v of filteredVoice) {
      if (!INCLUDE_STATUSES.has(v.status)) continue;
      const m = v.lesson_date?.slice(0, 7);
      if (m) {
        if (!byMonth[m]) byMonth[m] = { kine: 0, voice: 0 };
        byMonth[m].voice += v.cost || 0;
      }
    }
    const monthlyRows = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, val]) => ({
        month, label: new Date(month + '-01').toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }),
        kine: val.kine, voice: val.voice, total: val.kine + val.voice,
      }));

    // ── Recent transactions ──
    const recent: { date: string; name: string; amount: number; type: 'fnh' | 'voice'; id: string }[] = [];
    if (showKine) {
      for (const a of appointments) {
        if (a.is_paid || a.payment_received) {
          recent.push({ date: a.date, name: `Kine session`, amount: a.price_amount || 0, type: 'fnh', id: a.id });
        }
      }
    }
    for (const v of filteredVoice) {
      if (v.status === 'paid') {
        recent.push({ date: v.lesson_date, name: v.student_name || 'Voice student', amount: v.cost || 0, type: 'voice', id: v.id });
      }
    }
    recent.sort((a, b) => b.date.localeCompare(a.date));

    // ── Client activity ──
    const lastApptMap = new Map<string, string>();
    const totalPaidMap = new Map<string, number>();
    if (showKine) {
      for (const a of appointments) {
        const existing = lastApptMap.get(a.client_id);
        if (!existing || a.date > existing) lastApptMap.set(a.client_id, a.date);
        if (a.is_paid || a.payment_received) {
          totalPaidMap.set(a.client_id, (totalPaidMap.get(a.client_id) || 0) + (a.price_amount || 0));
        }
      }
    }
    const clientActivity = showKine ? clients
      .map(c => ({ ...c, lastDate: lastApptMap.get(c.id) || null, totalPaid: totalPaidMap.get(c.id) || 0 }))
      .sort((a, b) => {
        if (!a.lastDate && !b.lastDate) return 0;
        if (!a.lastDate) return 1; if (!b.lastDate) return -1;
        return b.lastDate.localeCompare(a.lastDate);
      }) : [];

    const titleLabel = viewFilter === 'fnh' ? 'FNH' : viewFilter === 'voice' ? 'Voice' : 'All';

    return {
      titleLabel, showKine, filteredVoice,
      totalRevenue: kineRevenue + voiceRevenue,
      monthRevenue: kineMonthRev + voiceMonthRev,
      kineRevenue, voiceRevenue, kineMonthRev, voiceMonthRev,
      activeClients: activeClientIds.size, totalClients: showKine ? clients.length : 0,
      newClients: newClientCount,
      voiceStudents: voiceStudentSet.size, paidKineCount, paidVoiceCount,
      totalSessions: paidKineCount + paidVoiceCount,
      srcBreakdown: Object.entries(srcCount).map(([source, d]) => ({
        source, count: d.count, revenue: d.revenue,
        color: SOURCE_COLORS[source] || 'bg-muted text-muted-foreground border-border',
      })),
      monthlyRows, scheduledVoiceCount,
      recentTransactions: recent.slice(0, 10),
      clientActivity,
    };
  }, [voiceData, appointments, clients, viewFilter, monthStart, now, practitionerEmail]);

  if (isLoading) {
    return (
      <AppLayout>
        <PageLoader label="Loading overview..." />
      </AppLayout>
    );
  }

  const d = derived!;

  return (
    <AppLayout variant="wide">
      <div className="flex flex-col gap-8 p-6">

        {/* Header + Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="rounded-xl text-xs gap-2 shrink-0">
              <ArrowLeft size={14} /> Back
            </Button>
            <PageHeader
              title={`Business Overview · ${d.titleLabel}`}
              subtitle="Revenue, clients, and performance metrics"
              icon={TrendingUp}
              className="mb-0"
            />
          </div>
          <div className="flex gap-1 rounded-lg border bg-muted/30 p-1 self-start">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setViewFilter(f.key)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  viewFilter === f.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >{f.label}</button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard icon={DollarSign} label="Total Revenue" value={fmt(d.totalRevenue)}
            sub={d.showKine && d.filteredVoice.length > 0
              ? `FNH ${fmt(d.kineRevenue)} · Voice ${fmt(d.voiceRevenue)}`
              : d.showKine ? `FNH ${fmt(d.kineRevenue)}` : `Voice ${fmt(d.voiceRevenue)}`
            } color="text-emerald-600" />
          <SummaryCard icon={TrendingUp} label="Monthly Revenue" value={fmt(d.monthRevenue)}
            sub={d.showKine && d.filteredVoice.length > 0
              ? `FNH ${fmt(d.kineMonthRev)} · Voice ${fmt(d.voiceMonthRev)}`
              : d.showKine ? `FNH ${fmt(d.kineMonthRev)}` : `Voice ${fmt(d.voiceMonthRev)}`
            } color="text-primary" />
          <SummaryCard icon={Users} label={d.showKine ? "Active Clients" : "Voice Students"}
            value={String(d.showKine ? d.activeClients : d.voiceStudents)}
            sub={d.showKine ? `${d.totalClients} total · ${d.newClients} new` : `${d.paidVoiceCount} paid sessions`}
            color="text-violet-600" />
          <SummaryCard icon={Mic} label="Paid Sessions" value={String(d.totalSessions)}
            sub={d.scheduledVoiceCount > 0 ? `+ ${d.scheduledVoiceCount} scheduled voice` : ''}
            color="text-rose-600" />
        </div>

        {/* Source Breakdown */}
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" /> Source Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {d.srcBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-full">No data for this filter.</p>
            ) : d.srcBreakdown.map(s => (
              <div key={s.source} className={cn("rounded-xl border p-5", s.color)}>
                <p className="text-sm font-medium uppercase tracking-wider mb-1">
                  {s.source === 'kine' ? 'FNH' : s.source === 'both' ? 'Voice & FNH' : s.source === 'voice' ? 'Voice' : s.source}
                </p>
                <p className="text-2xl font-bold">{s.count} paid sessions</p>
                <p className="text-sm mt-1 opacity-80">{fmt(s.revenue)} revenue</p>
              </div>
            ))}
          </div>
        </section>

        {/* Monthly Revenue */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Month</th>
                  {d.showKine && <th className="text-right px-4 py-3 font-medium text-muted-foreground">FNH</th>}
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Voice</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {d.monthlyRows.length === 0 ? (
                  <tr><td colSpan={d.showKine ? 4 : 3} className="px-4 py-8 text-center text-muted-foreground text-sm">No data</td></tr>
                ) : d.monthlyRows.map(m => (
                  <tr key={m.month} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{m.label}</td>
                    {d.showKine && <td className="px-4 py-3 text-right font-mono">{fmt(m.kine)}</td>}
                    <td className="px-4 py-3 text-right font-mono">{fmt(m.voice)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{fmt(m.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Payments */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Source</th>
                </tr>
              </thead>
              <tbody>
                {d.recentTransactions.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">No recent payments</td></tr>
                ) : d.recentTransactions.map(t => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">{new Date(t.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3">{t.name}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(t.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
                        t.type === 'fnh' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                      )}>{t.type === 'fnh' ? 'FNH' : 'Voice'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Client Activity */}
        {d.showKine && (
          <section>
            <h3 className="text-lg font-semibold mb-4">Clients by Activity</h3>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Session</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {d.clientActivity.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground text-sm">No clients</td></tr>
                  ) : d.clientActivity.slice(0, 20).map(c => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.lastDate ? new Date(c.lastDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{fmt(c.totalPaid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </AppLayout>
  );
};

const SummaryCard = ({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub?: string; color: string;
}) => (
  <div className="rounded-xl border bg-card p-5">
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
      <Icon className={cn("h-4 w-4", color)} /> {label}
    </div>
    <p className="text-3xl font-bold">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);

export default BusinessOverviewPage;
