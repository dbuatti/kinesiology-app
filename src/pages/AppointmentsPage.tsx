
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { groupAppointmentsByMonth } from "@/utils/crm-utils";
import { format, isToday, startOfMonth, endOfMonth, startOfToday, endOfToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Loader2, 
  Plus, 
  Trash2, 
  MoreVertical, 
  ExternalLink, 
  FlaskConical, 
  Activity, 
  Move, 
  ChevronDown, 
  Zap,
  CheckCircle2,
  CircleDashed,
  Search,
  CalendarDays,
  LayoutGrid,
  List,
  AlertCircle,
  Play,
  Copy,
  DollarSign,
  EyeOff,
  RefreshCw,
  CalendarClock,
  Calendar as CalendarIcon,
  User,
  ArrowRight,
  Wallet
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import AppointmentForm from "@/components/crm/AppointmentForm";
import { Appointment } from "@/types/crm";
import { showSuccess, showError } from "@/utils/toast";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { APPOINTMENT_STATUSES } from "@/data/appointment-data";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalendarView from "@/components/crm/CalendarView";
import QuickAssessmentModal from "@/components/crm/QuickAssessmentModal";
import { generateSessionSummary } from "@/utils/summary-generator";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import EmptyState from "@/components/shared/EmptyState";

interface AppointmentWithClient extends Appointment {
  clients: { name: string; id: string; latest_bolt?: number | null };
}

const PAGE_SIZE = 20;

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const { isPrivate } = usePrivacyMode();
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Scheduled");
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  const [stats, setStats] = useState({
    today: 0,
    month: 0,
    pending: 0,
    completed: 0
  });

  const [assessmentModal, setAssessmentModal] = useState<{ open: boolean; type: 'bolt' | 'coherence'; clientId: string; clientName: string } | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<{ open: boolean; appointment: any } | null>(null);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();
      const todayStart = startOfToday().toISOString();
      const todayEnd = endOfToday().toISOString();

      const [
        { count: todayCount },
        { count: monthCount },
        { count: pendingCount },
        { count: completedCount }
      ] = await Promise.all([
        supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('date', todayStart).lte('date', todayEnd),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('date', monthStart).lte('date', monthEnd),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'Scheduled'),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'Completed')
      ]);

      setStats({
        today: todayCount || 0,
        month: monthCount || 0,
        pending: pendingCount || 0,
        completed: completedCount || 0
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchAppointments = async (limit: number = PAGE_SIZE) => {
    if (limit === PAGE_SIZE) setLoading(true);
    else setLoadingMore(true);

    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          clients!inner (
            id,
            name,
            is_practitioner
          )
        `, { count: 'exact' })
        .or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' });

      if (statusFilter === "today") {
        query = query
          .gte('date', startOfToday().toISOString())
          .lte('date', endOfToday().toISOString());
      } else if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      const isAscending = statusFilter === "Scheduled" || statusFilter === "today";
      
      const { data, error, count } = await query
        .order('date', { ascending: isAscending })
        .limit(limit);

      if (error) throw error;
      setTotalCount(count || 0);

      const clientIds = Array.from(new Set((data || []).map(a => a.client_id)));
      const latestScores: Record<string, number> = {};
      
      if (clientIds.length > 0) {
        const { data: clientScores } = await supabase
          .from('appointments')
          .select('client_id, bolt_score, date')
          .in('client_id', clientIds)
          .not('bolt_score', 'is', null)
          .order('date', { ascending: false });

        clientScores?.forEach(score => {
          if (!latestScores[score.client_id]) {
            latestScores[score.client_id] = score.bolt_score;
          }
        });
      }

      const mapped = (data || []).map(a => ({
        ...a,
        date: new Date(a.date),
        clients: a.clients ? {
          ...a.clients,
          latest_bolt: latestScores[a.clients.id] || null
        } : { name: "Unknown Client", id: "unknown" }
      })) as unknown as AppointmentWithClient[];

      setAppointments(mapped);
      fetchStats();
    } catch (err) {
      console.error("Error fetching appointments:", err);
      showError("Failed to load appointments.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSyncFromCalcom = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-calcom-bookings');
      if (error) throw error;
      
      showSuccess(`Sync complete! ${data.syncedCount} bookings updated.`);
      fetchAppointments(displayLimit);
    } catch (err: any) {
      showError(err.message || "Failed to sync from Cal.com");
    } finally {
      setSyncing(false);
    }
  };

  const handleLoadMore = () => {
    const newLimit = displayLimit + PAGE_SIZE;
    setDisplayLimit(newLimit);
    fetchAppointments(newLimit);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      showSuccess(`Status updated to ${newStatus}`);
      fetchAppointments(displayLimit);
    } catch (err: any) {
      showError(err.message || "Failed to update status");
    }
  };

  const deleteAppointment = async (app: AppointmentWithClient) => {
    if (!confirm("Are you sure you want to delete this appointment? It will also be removed from Notion and Cal.com if linked.")) return;

    try {
      if (app.notion_page_id || app.notion_planner_id || app.calcom_booking_id) {
        await supabase.functions.invoke('delete-external-appointment', {
          body: { 
            notionPageId: app.notion_page_id, 
            notionPlannerId: app.notion_planner_id,
            calcomBookingId: app.calcom_booking_id 
          }
        });
      }

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', app.id);

      if (error) throw error;
      
      showSuccess("Appointment deleted from all platforms.");
      fetchAppointments(displayLimit);
    } catch (err: any) {
      showError(err.message || "Failed to delete appointment");
    }
  };

  const handleCopyFullSummary = (app: any) => {
    const summary = generateSessionSummary(app);
    navigator.clipboard.writeText(summary);
    showSuccess("Full session summary copied!");
  };

  useEffect(() => {
    setDisplayLimit(PAGE_SIZE);
    fetchAppointments(PAGE_SIZE);
  }, [statusFilter]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const clientName = app.clients?.name || "";
      const matchesSearch = clientName.toLowerCase().includes(search.toLowerCase()) ||
        app.tag.toLowerCase().includes(search.toLowerCase()) ||
        (app.name || "").toLowerCase().includes(search.toLowerCase());
      
      return matchesSearch;
    });
  }, [appointments, search]);

  const todaySessions = useMemo(() => 
    filteredAppointments
      .filter(app => isToday(app.date))
      .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [filteredAppointments]
  );

  const otherSessions = filteredAppointments.filter(app => !isToday(app.date));
  
  const monthSortOrder = (statusFilter === 'Scheduled' || statusFilter === 'today') ? 'asc' : 'desc';
  const grouped = groupAppointmentsByMonth(otherSessions, monthSortOrder);

  const AppointmentCard = ({ app }: { app: AppointmentWithClient }) => {
    const hasBolt = app.bolt_score !== null && app.bolt_score !== undefined;
    const hasCoherence = app.coherence_score !== null && app.coherence_score !== undefined;
    const isCompleted = app.status === 'Completed';
    const isTodaySession = isToday(app.date);
    const isHighRisk = app.clients?.latest_bolt !== null && app.clients?.latest_bolt! < 25;

    return (
      <Card 
        className={cn(
          "border-none transition-all duration-300 group overflow-hidden relative rounded-2xl md:rounded-[2.5rem] shadow-sm",
          isTodaySession 
            ? "bg-indigo-900 text-white shadow-xl shadow-indigo-200 dark:shadow-none ring-4 ring-indigo-500/10" 
            : "bg-card hover:shadow-md border border-border",
          isHighRisk && !isCompleted && !isTodaySession && "bg-rose-50/50 border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/30"
        )}
      >
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row md:items-center">
            {/* Time & Status Column */}
            <div className={cn(
              "p-6 md:p-8 md:w-48 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-border/10",
              isTodaySession ? "bg-white/5" : "bg-muted/30"
            )}>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-sm transition-transform group-hover:scale-110",
                isTodaySession ? "bg-white text-indigo-600" : "bg-indigo-600 text-white"
              )}>
                <Clock size={24} />
              </div>
              <p className={cn(
                "text-lg font-black tabular-nums",
                isTodaySession ? "text-white" : "text-foreground"
              )}>
                {format(app.date, "h:mm a")}
              </p>
              <p className={cn(
                "text-[9px] font-black uppercase tracking-widest mt-1",
                isTodaySession ? "text-indigo-300" : "text-muted-foreground"
              )}>
                {isTodaySession ? "Today" : format(app.date, "EEE, MMM d")}
              </p>
            </div>

            {/* Main Info Column */}
            <div className="flex-1 p-6 md:p-8 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <Link to={`/appointments/${app.id}`} className={cn(
                      "font-black text-xl md:text-2xl tracking-tight hover:underline decoration-2 underline-offset-4 truncate block",
                      isTodaySession ? "text-white decoration-indigo-400" : "text-foreground decoration-indigo-600",
                      isPrivate && "blur-sm select-none"
                    )}>
                      {app.clients?.name || "Unknown Client"}
                    </Link>
                    {isHighRisk && !isCompleted && (
                      <Badge className="bg-rose-500 text-white border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full animate-pulse shrink-0">
                        High Priority
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn(
                      "font-black text-[8px] uppercase tracking-widest border-none px-2 py-0.5 rounded-md",
                      isTodaySession ? "bg-white/10 text-indigo-200" : "bg-muted text-muted-foreground"
                    )}>
                      {app.tag}
                    </Badge>
                    {app.is_paid && (
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest flex items-center gap-1",
                        app.payment_received 
                          ? (isTodaySession ? "text-emerald-400" : "text-emerald-600") 
                          : (isTodaySession ? "text-amber-400" : "text-amber-600")
                      )}>
                        <DollarSign size={10} /> {app.payment_received ? "Paid" : "Due"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isTodaySession && !isCompleted && (
                    <Button 
                      size="sm" 
                      className="bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl h-9 px-5 font-black text-[10px] uppercase tracking-widest shadow-lg"
                      onClick={() => navigate(`/appointments/${app.id}`)}
                    >
                      <Play size={14} className="mr-2 fill-current" /> Start Session
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className={cn(
                        "h-9 w-9 rounded-xl transition-all",
                        isTodaySession ? "text-white/40 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:bg-muted"
                      )}>
                        <MoreVertical size={18} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl p-2 shadow-2xl border-none bg-white dark:bg-slate-900">
                      <DropdownMenuItem asChild className="rounded-xl py-2.5 px-4 cursor-pointer">
                        <Link to={`/appointments/${app.id}`} className="flex items-center gap-3">
                          <ExternalLink size={16} className="text-indigo-500" /> View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3"
                        onClick={() => setRescheduleModal({ open: true, appointment: app })}
                      >
                        <CalendarClock size={16} className="text-amber-500" /> Reschedule
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3"
                        onClick={() => handleCopyFullSummary(app)}
                      >
                        <Copy size={16} className="text-slate-500" /> Copy Summary
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3"
                        onClick={() => deleteAppointment(app)}
                      >
                        <Trash2 size={16} /> Delete Session
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {app.goal && (
                <p className={cn(
                  "text-sm leading-relaxed line-clamp-1 italic font-medium",
                  isTodaySession ? "text-indigo-100/70" : "text-muted-foreground",
                  isPrivate && "blur-md select-none opacity-40"
                )}>
                  "{app.goal}"
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {hasBolt && (
                  <Badge className={cn(
                    "border-none font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1.5",
                    isTodaySession ? "bg-white/10 text-white" : "bg-indigo-50 text-indigo-700"
                  )}>
                    <FlaskConical size={10} /> BOLT: {app.bolt_score}s
                  </Badge>
                )}
                {hasCoherence && (
                  <Badge className={cn(
                    "border-none font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1.5",
                    isTodaySession ? "bg-white/10 text-white" : "bg-rose-50 text-rose-700"
                  )}>
                    <Activity size={10} /> COH: {app.coherence_score?.toFixed(2)}
                  </Badge>
                )}
                <div className={cn(
                  "ml-auto text-[9px] font-black uppercase tracking-widest opacity-40",
                  isTodaySession ? "text-white" : "text-muted-foreground"
                )}>
                  ID: {app.display_id || app.id.slice(0,8)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-10">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today", value: stats.today, icon: Zap, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/20" },
          { label: "This Month", value: stats.month, icon: CalendarIcon, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
          { label: "Scheduled", value: stats.pending, icon: CircleDashed, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-card rounded-2xl overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-4 rounded-[2rem] border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search sessions..." 
              className="pl-12 bg-muted/50 border-none h-12 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 h-12 bg-muted p-1 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg text-[10px] font-black uppercase tracking-widest">All</TabsTrigger>
              <TabsTrigger value="today" className="rounded-lg text-[10px] font-black uppercase tracking-widest text-rose-600">Today</TabsTrigger>
              <TabsTrigger value="Scheduled" className="rounded-lg text-[10px] font-black uppercase tracking-widest">Pending</TabsTrigger>
              <TabsTrigger value="Completed" className="rounded-lg text-[10px] font-black uppercase tracking-widest">Done</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <Button 
            variant="outline" 
            onClick={handleSyncFromCalcom}
            disabled={syncing}
            className="rounded-xl h-12 px-6 font-black text-[10px] uppercase tracking-widest border-indigo-100 text-indigo-600 hover:bg-indigo-50"
          >
            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw size={18} className="mr-2" />}
            Sync Cal.com
          </Button>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 rounded-xl h-12 px-8 font-black text-xs uppercase tracking-widest">
                <Plus size={20} className="mr-2" /> New Session
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0">
              <div className="p-8">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-black">Schedule New Session</DialogTitle>
                  <DialogDescription className="font-medium">Create a new appointment for an existing client.</DialogDescription>
                </DialogHeader>
                <AppointmentForm 
                  onSuccess={() => {
                    setOpen(false);
                    fetchAppointments(displayLimit);
                  }} 
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="p-24 flex flex-col items-center justify-center gap-6">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Loading your schedule...</p>
        </div>
      ) : (
        <div className="space-y-16">
          {todaySessions.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0 shadow-sm">
                  <Zap size={24} className="fill-current" />
                </div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Today's Sessions</h2>
                <div className="flex-1 h-[2px] bg-rose-100 dark:bg-rose-900/30 rounded-full opacity-50" />
              </div>
              <div className="grid gap-4">
                {todaySessions.map(app => <AppointmentCard key={app.id} app={app} />)}
              </div>
            </div>
          )}

          {grouped.map(([month, apps]) => (
            <div key={month} className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 shadow-sm">
                  <CalendarIcon size={24} />
                </div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">{month}</h2>
                <div className="flex-1 h-[2px] bg-border rounded-full opacity-50" />
              </div>
              <div className="grid gap-4">
                {apps.map(app => <AppointmentCard key={app.id} app={app} />)}
              </div>
            </div>
          ))}

          {filteredAppointments.length === 0 && (
            <EmptyState 
              icon={CalendarIcon}
              title="No appointments found"
              description="Try adjusting your search or schedule a new session."
              actionLabel="Schedule First Session"
              onAction={() => { setSearch(""); setStatusFilter("all"); setOpen(true); }}
            />
          )}

          {appointments.length < totalCount && (
            <div className="flex justify-center pt-8">
              <Button 
                onClick={handleLoadMore} 
                disabled={loadingMore}
                variant="outline"
                className="h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest border-indigo-100 text-indigo-600 hover:bg-indigo-50 shadow-lg"
              >
                {loadingMore ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown size={18} className="mr-2" />
                )}
                {loadingMore ? "Loading..." : `Load More Sessions (${totalCount - appointments.length} remaining)`}
              </Button>
            </div>
          )}
        </div>
      )}

      {assessmentModal && (
        <QuickAssessmentModal 
          open={assessmentModal.open}
          onOpenChange={(open) => !open && setAssessmentModal(null)}
          clientId={assessmentModal.clientId}
          clientName={assessmentModal.clientName}
          type={assessmentModal.type}
          onComplete={() => fetchAppointments(displayLimit)}
        />
      )}

      <Dialog open={!!rescheduleModal} onOpenChange={(open) => !open && setRescheduleModal(null)}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-[2rem] p-0">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                  <CalendarClock size={24} />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black">Reschedule Session</DialogTitle>
                  <DialogDescription className="font-medium">Update the date, time, or details for this session.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {rescheduleModal && (
              <AppointmentForm 
                existingAppointment={rescheduleModal.appointment}
                onSuccess={() => {
                  setRescheduleModal(null);
                  fetchAppointments(displayLimit);
                }} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentsPage;