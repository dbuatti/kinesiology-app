import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, Users, DollarSign, Mic, Calendar, ChevronRight, Loader2, Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import AppLayout from '@/components/crm/AppLayout';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VoiceBooking {
  id: string; student_name: string | null; student_email: string | null;
  lesson_date: string; lesson_time: string | null;
  cost: number | null; status: string;
}
interface KineAppt {
  id: string; client_id: string; date: string;
  price_amount: number | null; is_paid: boolean | null;
  payment_received: boolean | null; status: string; tag: string | null;
}
interface ClientRow { id: string; name: string; standard_rate: number | null; }

const fmt = (n: number) => "$" + n.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const BusinessDashboardPage = () => {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => now.toISOString().slice(0, 10), [now]);
  const [practitionerEmail, setPractitionerEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setPractitionerEmail(data.user.email.toLowerCase());
    });
  }, []);

  const { data: voiceData } = useQuery({
    queryKey: ['biz-dash-voice'],
    queryFn: async () => {
      const { data } = await supabase.from('voice_bookings').select('*');
      return (data || []) as VoiceBooking[];
    },
  });
  const { data: appointments } = useQuery({
    queryKey: ['biz-dash-appts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('id, client_id, date, price_amount, is_paid, payment_received, status, tag');
      return (data || []) as KineAppt[];
    },
  });
  const { data: clients } = useQuery({
    queryKey: ['biz-dash-clients'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, name, standard_rate')
        .or('is_practitioner.eq.false,is_practitioner.is.null');
      return (data || []) as ClientRow[];
    },
  });

  const isLoading = !voiceData || !appointments || !clients;

  const derived = useMemo(() => {
    if (!voiceData || !appointments || !clients) return null;

    const clientMap = new Map(clients.map(c => [c.id, c.name]));
    const filterSelf = (v: VoiceBooking) =>
      v.student_name &&
      v.student_email &&
      (!practitionerEmail || v.student_email.toLowerCase() !== practitionerEmail);

    // Today's sessions
    const todayAppts = appointments.filter(a => a.date === todayStr);
    const todayVoice = voiceData.filter(v => v.lesson_date === todayStr && v.status !== 'cancelled' && filterSelf(v));
    const todayTotal = todayAppts.length + todayVoice.length;
    const todayRevenue = [...todayAppts, ...todayVoice].reduce((s, i) => s + (('price_amount' in i ? (i as KineAppt).price_amount : (i as VoiceBooking).cost) || 0), 0);

    // Upcoming (next 7 days)
    const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);
    const upcomingAppts = appointments.filter(a => a.date > todayStr && a.date <= weekEndStr && a.status !== 'cancelled');
    const upcomingVoice = voiceData.filter(v => v.lesson_date > todayStr && v.lesson_date <= weekEndStr && v.status === 'scheduled' && filterSelf(v));

    // Recent payments (last 30 paid)
    const paid: { date: string; name: string; amount: number; type: 'fnh' | 'voice'; id: string }[] = [];
    for (const a of appointments) {
      if (a.is_paid || a.payment_received) {
        paid.push({ date: a.date, name: clientMap.get(a.client_id) || 'Unknown', amount: a.price_amount || 0, type: 'fnh', id: a.id });
      }
    }
    for (const v of voiceData) {
      if (v.status === 'paid' && filterSelf(v)) {
        paid.push({ date: v.lesson_date, name: v.student_name || 'Voice student', amount: v.cost || 0, type: 'voice', id: v.id });
      }
    }
    paid.sort((a, b) => b.date.localeCompare(a.date));

    // Quick stats
    const monthStart = now.toISOString().slice(0, 7);
    let monthKine = 0, monthVoice = 0;
    for (const a of appointments) {
      if ((a.is_paid || a.payment_received) && a.date >= monthStart) monthKine += a.price_amount || 0;
    }
    for (const v of voiceData) {
      if ((v.status === 'paid') && v.lesson_date >= monthStart && filterSelf(v)) monthVoice += v.cost || 0;
    }
    const activeVoiceStudents = new Set(voiceData.filter(v => v.status !== 'cancelled' && filterSelf(v)).map(v => v.student_email).filter(Boolean));
    const activeKineClients = new Set(appointments.filter(a => {
      const d = new Date(a.date);
      return d >= new Date(now.getTime() - 90 * 86400000);
    }).map(a => a.client_id));

    return {
      todayTotal, todayRevenue,
      todayAppts, todayVoice,
      upcomingAppts, upcomingVoice, weekEndStr,
      recentPayments: paid.slice(0, 10),
      monthKine, monthVoice,
      activeKineCount: activeKineClients.size,
      activeVoiceCount: activeVoiceStudents.size,
      totalClients: clients.length,
      clientMap,
    };
  }, [voiceData, appointments, clients, now, todayStr, practitionerEmail]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const d = derived!;

  return (
    <AppLayout variant="wide">
      <div className="flex flex-col gap-8 p-6">

        <PageHeader title="Business Dashboard" subtitle="Today's overview and quick actions" icon={TrendingUp} />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard icon={Calendar} label="Today" value={`${d.todayTotal} sessions`}
            sub={fmt(d.todayRevenue) + ' today'} color="text-blue-600" />
          <SummaryCard icon={Clock} label="This Month" value={fmt(d.monthKine + d.monthVoice)}
            sub={`FNH ${fmt(d.monthKine)} · Voice ${fmt(d.monthVoice)}`} color="text-emerald-600" />
          <SummaryCard icon={Users} label="Active" value={`${d.activeKineCount} FNH`}
            sub={`${d.activeVoiceCount} voice · ${d.totalClients} total clients`} color="text-violet-600" />
          <SummaryCard icon={TrendingUp} label="Upcoming Week" value={`${d.upcomingAppts.length + d.upcomingVoice.length} sessions`}
            sub={`${d.upcomingAppts.length} FNH · ${d.upcomingVoice.length} voice`} color="text-rose-600" />
        </div>

        {/* Two-column: Today + Upcoming */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Sessions */}
          <section className="rounded-xl border">
            <h3 className="text-sm font-semibold px-5 py-3 border-b bg-muted/30">Today's Sessions</h3>
            {d.todayAppts.length === 0 && d.todayVoice.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No sessions today</p>
            ) : (
              <>
                {d.todayAppts.map(a => (
                  <button key={a.id} onClick={() => navigate(`/appointments/${a.id}`)}
                    className="w-full flex items-center justify-between px-5 py-3 border-b last:border-0 hover:bg-muted/20 text-left">
                    <div>
                      <p className="text-sm font-medium">{d.clientMap.get(a.client_id) || 'Client'}</p>
                      <p className="text-xs text-muted-foreground">FNH · {a.status}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.price_amount ? <span className="text-sm font-mono">{fmt(a.price_amount)}</span> : null}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
                {d.todayVoice.map(v => (
                  <div key={v.id} className="flex items-center justify-between px-5 py-3 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{v.student_name || 'Student'}</p>
                      <p className="text-xs text-muted-foreground">Voice · {v.lesson_time || ''}</p>
                    </div>
                    {v.cost ? <span className="text-sm font-mono">{fmt(v.cost)}</span> : null}
                  </div>
                ))}
              </>
            )}
          </section>

          {/* Upcoming This Week */}
          <section className="rounded-xl border">
            <h3 className="text-sm font-semibold px-5 py-3 border-b bg-muted/30">Upcoming This Week</h3>
            {d.upcomingAppts.length === 0 && d.upcomingVoice.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">Nothing scheduled</p>
            ) : (
              <>
                {d.upcomingAppts.map(a => (
                  <button key={a.id} onClick={() => navigate(`/appointments/${a.id}`)}
                    className="w-full flex items-center justify-between px-5 py-3 border-b last:border-0 hover:bg-muted/20 text-left">
                    <div>
                      <p className="text-sm font-medium">{d.clientMap.get(a.client_id) || 'Client'}</p>
                      <p className="text-xs text-muted-foreground">{a.date} · FNH</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
                {d.upcomingVoice.map(v => (
                  <div key={v.id} className="flex items-center justify-between px-5 py-3 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{v.student_name || 'Student'}</p>
                      <p className="text-xs text-muted-foreground">{v.lesson_date} · {v.lesson_time || ''}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </section>
        </div>

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
                {d.recentPayments.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">No recent payments</td></tr>
                ) : d.recentPayments.map(t => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">{new Date(t.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</td>
                    <td className="px-4 py-3">{t.name}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(t.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        t.type === 'fnh' ? 'border-emerald-500/30 text-emerald-600' : 'border-rose-500/30 text-rose-600'
                      )}>{t.type === 'fnh' ? 'FNH' : 'Voice'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button onClick={() => navigate('/calendar')} variant="default">
            <Calendar className="h-4 w-4 mr-2" /> Book Session
          </Button>
          <Button onClick={() => navigate('/business/overview')} variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" /> Full Overview
          </Button>
        </div>

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
    <p className="text-2xl font-bold">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);

export default BusinessDashboardPage;
