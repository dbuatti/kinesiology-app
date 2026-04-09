"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, Activity, Loader2,
  UserPlus, Zap, Wind,
  ArrowRight, Clock,
  ClipboardCheck, Link as LinkIcon, Check,
  Coffee, CalendarPlus, Target
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ClientForm from "@/components/crm/ClientForm";
import AppointmentForm from "@/components/crm/AppointmentForm";
import RecentActivity from "@/components/crm/RecentActivity";
import UpcomingAppointments from "@/components/crm/UpcomingAppointments";
import { format, isToday, subDays, differenceInMinutes, startOfWeek, endOfWeek, isWithinInterval, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import MeridianClock from "@/components/crm/MeridianClock";
import { AppointmentWithClient } from "@/types/crm";
import DashboardStats from "@/components/crm/DashboardStats";
import DailyBriefing from "@/components/crm/DailyBriefing";
import AppLayout from "@/components/crm/AppLayout";
import PractitionerGrounding from "@/components/crm/PractitionerGrounding";
import ClientWins from "@/components/crm/ClientWins";
import { cn } from "@/lib/utils";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { showSuccess } from "@/utils/toast";
import Scratchpad from "@/components/crm/Scratchpad";
import QuickActionsGrid from "@/components/crm/QuickActionsGrid";

const Index = () => {
  const { isPrivate } = usePrivacyMode();
  const [stats, setStats] = useState({ 
    clients: 0, 
    appointments: 0,
    newClients30d: 0,
    sessions30d: 0,
    sessionsThisWeek: 0,
    avgBolt: 0,
    avgCoherence: 0,
    imperativeAlerts: 0
  });
  const [todaySessions, setTodaySessions] = useState<AppointmentWithClient[]>([]);
  const [activeSession, setActiveSession] = useState<AppointmentWithClient | null>(null);
  const [pendingOnboarding, setPendingOnboarding] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyLink = (e: React.MouseEvent, clientId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/onboarding/${clientId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(clientId);
    showSuccess("Onboarding link copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchDashboardData = async () => {
    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());

      const [
        { count: clientCount }, 
        { count: appCount }, 
        { data: allAppsRaw },
        { count: newClientsCount },
        { count: recentAppsCount },
        { data: clinicalClients },
        { data: recentOnboarding }
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null'),
        supabase.from('appointments').select('*, clients!inner(is_practitioner)', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }),
        supabase.from('appointments').select('*, clients!inner(name, is_practitioner)').or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }).order('date', { ascending: true }),
        supabase.from('clients').select('*', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null').gte('created_at', thirtyDaysAgo),
        supabase.from('appointments').select('*, clients!inner(is_practitioner)', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }).gte('date', thirtyDaysAgo),
        supabase.from('clients').select('id, name, appointments(bolt_score, date)').or('is_practitioner.eq.false,is_practitioner.is.null'),
        supabase.from('clients').select('id, name, created_at').or('is_practitioner.eq.false,is_practitioner.is.null').order('created_at', { ascending: false }).limit(3)
      ]);

      setPendingOnboarding(recentOnboarding || []);

      const allApps = (allAppsRaw || []).map(a => ({
        ...a,
        clientId: (a as any).client_id,
        date: new Date(a.date)
      })) as unknown as AppointmentWithClient[];

      const boltScores = allApps.filter(a => a.bolt_score).map(a => a.bolt_score as number);
      const cohScores = allApps.filter(a => a.coherence_score).map(a => a.coherence_score as number);
      
      const avgBolt = boltScores.length > 0 ? Math.round(boltScores.reduce((a, b) => a + b, 0) / boltScores.length) : 0;
      const avgCoh = cohScores.length > 0 ? cohScores.reduce((a, b) => a + b, 0) / cohScores.length : 0;

      let imperativeAlerts = 0;
      clinicalClients?.forEach(client => {
        const sortedApps = (client.appointments || [])
          .filter((a: any) => a.bolt_score !== null)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        if (sortedApps.length > 0) {
          const latestBolt = (sortedApps[0] as any).bolt_score;
          if (latestBolt < 25) imperativeAlerts++;
        }
      });

      const sessionsThisWeek = allApps.filter(app => 
        isWithinInterval(app.date, { start: weekStart, end: weekEnd })
      ).length;

      setStats({ 
        clients: clientCount || 0, 
        appointments: appCount || 0,
        newClients30d: newClientsCount || 0,
        sessions30d: recentAppsCount || 0,
        sessionsThisWeek,
        avgBolt,
        avgCoherence: avgCoh,
        imperativeAlerts
      });

      const today = allApps.filter(app => isToday(app.date));
      setTodaySessions(today);

      const now = new Date();
      const active = today.find(app => {
        const diff = differenceInMinutes(now, app.date);
        return diff >= 0 && diff < 60 && app.status !== 'Completed';
      });
      setActiveSession(active || null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return (
    <AppLayout>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2"><Skeleton className="h-8 md:h-10 w-48 md:w-64 rounded-xl md:rounded-2xl" /><Skeleton className="h-3 md:h-4 w-64 md:w-96 rounded-lg md:rounded-xl" /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 md:h-32 w-full rounded-2xl md:rounded-[2.5rem]" />)}
        </div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="space-y-8 md:space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
          <div className="space-y-1 md:space-y-2">
            <Badge className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-none font-black text-[8px] md:text-[10px] uppercase tracking-[0.3em] px-4 md:px-6 py-1.5 md:py-2 rounded-full mb-1 md:mb-2">
              Practitioner Command Center
            </Badge>
            <h1 className="text-3xl md:text-6xl font-serif font-bold tracking-tighter text-primary">Practice Hub</h1>
            <p className="text-sm md:text-xl text-muted-foreground font-medium max-w-2xl">Welcome back, Daniele. Here is your clinical landscape for today.</p>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden lg:flex flex-col items-end">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current Time</p>
              <p className="text-2xl font-serif font-bold text-primary">{format(currentTime, "h:mm a")}</p>
            </div>
            <div className="w-px h-10 md:h-12 bg-border hidden lg:block" />
            <div className="flex items-center gap-3 md:gap-4 bg-white dark:bg-slate-900 p-3 md:p-4 rounded-2xl md:rounded-[2rem] border border-secondary/30 shadow-sm">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-muted rounded-xl md:rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <Calendar size={20} className="md:w-6 md:h-6" />
              </div>
              <div className="pr-2 md:pr-4">
                <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Today</p>
                <p className="text-sm md:text-lg font-bold text-primary">{format(currentTime, "EEEE, MMM d")}</p>
              </div>
            </div>
          </div>
        </div>

        <PractitionerGrounding />

        <QuickActionsGrid 
          onNewClient={() => setClientDialogOpen(true)} 
          onBookSession={() => setAppDialogOpen(true)} 
        />

        <DashboardStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          <div className="lg:col-span-8 space-y-12 md:space-y-16">
            <DailyBriefing todaySessions={todaySessions} activeSession={activeSession} />
            
            {pendingOnboarding.length > 0 && (
              <div className="space-y-6 md:space-y-8">
                <div className="flex items-center justify-between px-2">
                  <div className="space-y-0.5 md:space-y-1">
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary flex items-center gap-3 md:gap-4">
                      <ClipboardCheck size={24} className="md:w-8 md:h-8 text-accent" /> Recent Onboarding
                    </h2>
                    <p className="text-xs md:text-base text-muted-foreground font-medium">New client submissions ready for review.</p>
                  </div>
                  <Badge className="bg-accent text-white border-none font-black text-[8px] md:text-[10px] uppercase tracking-widest px-3 md:px-4 py-1 md:py-1.5 rounded-full shadow-lg shadow-accent/20">
                    {pendingOnboarding.length} New
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {pendingOnboarding.map(client => (
                    <div key={client.id} className="p-4 md:p-6 bg-white dark:bg-slate-900 rounded-2xl md:rounded-[2.5rem] border border-secondary/30 flex items-center justify-between group hover:shadow-xl transition-all duration-500">
                      <Link to={`/clients/${client.id}`} className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-muted text-primary flex items-center justify-center font-black text-lg md:text-xl shadow-inner shrink-0">
                          {client.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className={cn("font-black text-base md:text-lg text-foreground group-hover:text-accent transition-colors truncate", isPrivate && "blur-sm")}>{client.name}</p>
                          <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mt-0.5 md:mt-1">
                            <Clock size={12} className="md:w-3.5 md:h-3.5 text-accent" /> {formatDistanceToNow(new Date(client.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 md:h-10 px-2 md:px-4 rounded-lg md:rounded-xl text-indigo-600 hover:bg-indigo-50 font-black text-[8px] md:text-[10px] uppercase tracking-widest"
                          onClick={(e) => handleCopyLink(e, client.id)}
                        >
                          {copiedId === client.id ? <Check size={14} className="md:mr-2 text-emerald-500" /> : <LinkIcon size={14} className="md:mr-2" />}
                          <span className="hidden sm:inline">{copiedId === client.id ? "Copied" : "Link"}</span>
                        </Button>
                        <Link to={`/clients/${client.id}`}>
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-muted text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                          </div>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Scratchpad />
          </div>

          <div className="lg:col-span-4 space-y-12 md:space-y-16">
            <ClientWins />
            <MeridianClock />
            <UpcomingAppointments />
            <RecentActivity />

            <div className="p-8 md:p-10 bg-primary text-white rounded-2xl md:rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
              <div className="absolute top-0 right-0 p-6 md:p-8 opacity-10 group-hover:scale-110 transition-transform duration-700"><Wind size={100} className="md:w-[150px] md:h-[150px]" /></div>
              <div className="relative z-10 space-y-6 md:space-y-8">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-xl">
                    <Wind size={20} className="md:w-6 md:h-6 text-secondary" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-serif font-bold">Clinical Focus</h3>
                </div>
                <div className="p-4 md:p-6 bg-white/10 rounded-xl md:rounded-[2rem] border border-white/10 shadow-inner">
                  <p className="text-[8px] md:text-[10px] font-black text-secondary uppercase tracking-widest mb-2 md:mb-3">Practice Goal</p>
                  <p className="text-base md:text-xl font-bold leading-snug">Improve practice-wide BOLT scores by 15% this quarter.</p>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                    <span className="text-secondary">Quarterly Progress</span>
                    <span className="text-white">68%</span>
                  </div>
                  <div className="h-2 md:h-2.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-white rounded-full shadow-lg" style={{ width: '68%' }} />
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] h-12 md:h-14 shadow-lg" asChild>
                  <Link to="/oversight">View Clinical Oversight</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl md:rounded-[3rem] p-0">
          <div className="p-6 md:p-10">
            <DialogHeader className="mb-6 md:mb-8">
              <DialogTitle className="text-2xl md:text-3xl font-serif font-bold tracking-tight">Add New Client</DialogTitle>
              <DialogDescription className="text-base md:text-lg font-medium">Create a new client profile in your clinical database.</DialogDescription>
            </DialogHeader>
            <ClientForm onSuccess={() => { setClientDialogOpen(false); fetchDashboardData(); }} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-2xl md:rounded-[3rem] p-0">
          <div className="p-6 md:p-10">
            <DialogHeader className="mb-6 md:mb-8">
              <DialogTitle className="text-2xl md:text-3xl font-serif font-bold tracking-tight">Schedule New Session</DialogTitle>
              <DialogDescription className="text-base md:text-lg font-medium">Book a new appointment for an existing client.</DialogDescription>
            </DialogHeader>
            <AppointmentForm onSuccess={() => { setAppDialogOpen(false); fetchDashboardData(); }} />
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Index;