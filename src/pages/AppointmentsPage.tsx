import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { groupAppointmentsByMonth } from "@/utils/crm-utils";
import { format, isToday, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
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
  Search,
  Filter,
  CalendarDays,
  CheckCircle,
  CircleDashed,
  LayoutGrid,
  List,
  AlertCircle,
  Play,
  Printer
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import Breadcrumbs from "@/components/crm/Breadcrumbs";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalendarView from "@/components/crm/CalendarView";
import QuickAssessmentModal from "@/components/crm/QuickAssessmentModal";

interface AppointmentWithClient extends Appointment {
  clients: { name: string; id: string; latest_bolt?: number | null };
}

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Quick Assessment State
  const [assessmentModal, setAssessmentModal] = useState<{ open: boolean; type: 'bolt' | 'coherence'; clientId: string; clientName: string } | null>(null);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (
            id,
            name
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      // Fetch latest BOLT scores for all clients to show risk indicators
      const { data: clientScores } = await supabase
        .from('appointments')
        .select('client_id, bolt_score, date')
        .not('bolt_score', 'is', null)
        .order('date', { ascending: false });

      const latestScores: Record<string, number> = {};
      clientScores?.forEach(score => {
        if (!latestScores[score.client_id]) {
          latestScores[score.client_id] = score.bolt_score;
        }
      });

      const mapped = (data || []).map(a => ({
        ...a,
        date: new Date(a.date),
        clients: {
          ...a.clients,
          latest_bolt: latestScores[a.clients.id] || null
        }
      })) as unknown as AppointmentWithClient[];

      setAppointments(mapped);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      showSuccess(`Status updated to ${newStatus}`);
      fetchAppointments();
    } catch (err: any) {
      showError(err.message || "Failed to update status");
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      showSuccess("Appointment deleted");
      fetchAppointments();
    } catch (err: any) {
      showError(err.message || "Failed to delete appointment");
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const matchesSearch = app.clients?.name.toLowerCase().includes(search.toLowerCase()) ||
        app.tag.toLowerCase().includes(search.toLowerCase()) ||
        app.name?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return {
      today: appointments.filter(a => isToday(a.date)).length,
      month: appointments.filter(a => isWithinInterval(a.date, { start: monthStart, end: monthEnd })).length,
      pending: appointments.filter(a => a.status === 'Scheduled').length,
      completed: appointments.filter(a => a.status === 'Completed').length
    };
  }, [appointments]);

  const todaySessions = filteredAppointments.filter(app => isToday(app.date));
  const otherSessions = filteredAppointments.filter(app => !isToday(app.date));
  const grouped = groupAppointmentsByMonth(otherSessions);

  const AppointmentCard = ({ app }: { app: AppointmentWithClient }) => {
    const hasBolt = app.bolt_score !== null && app.bolt_score !== undefined;
    const hasCoherence = app.coherence_score !== null && app.coherence_score !== undefined;
    const hasCogs = app.sagittal_plane_notes || app.frontal_plane_notes || app.transverse_plane_notes;
    const hasAnyAssessment = hasBolt || hasCoherence || hasCogs;
    const isCompleted = app.status === 'Completed';
    const isTodaySession = isToday(app.date);
    const isHighRisk = app.clients.latest_bolt !== null && app.clients.latest_bolt! < 25;

    return (
      <Card 
        className={cn(
          "border-border transition-all duration-300 group overflow-hidden relative rounded-[2rem]",
          isTodaySession 
            ? "border-indigo-300 dark:border-indigo-900/50 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 ring-2 ring-indigo-50 dark:ring-indigo-900/10 bg-card" 
            : "bg-card hover:shadow-xl hover:border-muted-foreground/20",
          isHighRisk && !isCompleted && "border-rose-200 dark:border-rose-900/50 ring-rose-50 dark:ring-rose-900/10"
        )}
      >
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row sm:items-stretch">
            <div className="p-8 flex-1 space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Link to={`/appointments/${app.id}`} className="font-black text-2xl text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {app.clients?.name}
                    </Link>
                    {isTodaySession && (
                      <Badge className="bg-rose-500 text-white border-none animate-pulse font-black text-[8px] uppercase tracking-widest px-2 py-0.5">
                        Live Today
                      </Badge>
                    )}
                    {isHighRisk && !isCompleted && (
                      <Badge className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 flex items-center gap-1">
                        <AlertCircle size={10} /> High Priority
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="flex items-center gap-2 font-bold text-muted-foreground">
                      <Clock size={16} className={cn(isTodaySession ? "text-rose-500" : "text-indigo-500")} />
                      {format(app.date, isTodaySession ? "h:mm a" : "EEEE, d MMM • h:mm a")}
                    </span>
                    <Badge variant="secondary" className="bg-muted text-muted-foreground font-black text-[10px] uppercase tracking-widest border-none px-3 py-1">
                      {app.tag}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {app.goal && (
                <div className="text-sm bg-muted/30 rounded-2xl p-4 border border-border group-hover:bg-card group-hover:border-indigo-100 dark:group-hover:border-indigo-900/50 transition-all">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-2">Session Goal</span>
                  <p className="text-foreground font-medium leading-relaxed line-clamp-2 italic">"{app.goal}"</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex flex-wrap gap-3">
                  {hasBolt && (
                    <Badge className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                      <FlaskConical size={12} /> BOLT: {app.bolt_score}s
                    </Badge>
                  )}
                  {hasCoherence && (
                    <Badge className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                      <Activity size={12} /> COH: {app.coherence_score?.toFixed(2)}
                    </Badge>
                  )}
                  {hasCogs && (
                    <Badge className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                      <Move size={12} /> COGS
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 rounded-xl text-slate-400 hover:text-indigo-600 font-black text-[9px] uppercase tracking-widest"
                    onClick={() => navigate(`/appointments/${app.id}`)}
                  >
                    <Printer size={12} className="mr-1" /> Worksheet
                  </Button>
                  {isTodaySession && !isCompleted && (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-right-2 duration-500">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 rounded-xl border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-black text-[9px] uppercase tracking-widest"
                        onClick={() => setAssessmentModal({ open: true, type: 'bolt', clientId: app.clients.id, clientName: app.clients.name })}
                      >
                        <FlaskConical size={12} className="mr-1" /> Log BOLT
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest"
                        onClick={() => navigate(`/appointments/${app.id}`)}
                      >
                        <Play size={12} className="mr-1 fill-current" /> Start
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 flex flex-col justify-between items-end border-t sm:border-t-0 sm:border-l border-border bg-muted/30 group-hover:bg-indigo-50/20 dark:group-hover:bg-indigo-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant={isCompleted ? 'default' : 'outline'} 
                      className={cn(
                        "font-black h-9 text-[10px] uppercase tracking-widest rounded-xl shadow-sm px-4",
                        isCompleted ? 'bg-emerald-600 hover:bg-emerald-700 border-none text-white' : 'border-border text-muted-foreground bg-card hover:bg-muted'
                      )}
                    >
                      {app.status}
                      <ChevronDown size={14} className="ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-2xl border-none bg-card">
                    {APPOINTMENT_STATUSES.map(status => (
                      <DropdownMenuItem 
                        key={status}
                        onClick={() => updateStatus(app.id, status)}
                        className={cn(
                          "flex items-center justify-between rounded-xl py-2.5 px-4 cursor-pointer",
                          app.status === status && "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-black"
                        )}
                      >
                        {status}
                        {app.status === status && <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-card rounded-xl transition-all">
                      <MoreVertical size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl p-2 shadow-2xl border-none bg-card">
                    <DropdownMenuItem asChild className="rounded-xl py-2.5 px-4 cursor-pointer">
                      <Link to={`/appointments/${app.id}`} className="flex items-center gap-3">
                        <ExternalLink size={16} className="text-indigo-500" /> View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3"
                      onClick={() => deleteAppointment(app.id)}
                    >
                      <Trash2 size={16} /> Delete Session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  Session ID
                </span>
                <span className="text-xs font-bold text-muted-foreground font-mono">
                  {app.display_id || app.id.slice(0,8)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-10">
      <Breadcrumbs items={[{ label: "Appointments" }]} />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Appointments</h1>
          <p className="text-muted-foreground font-medium mt-1">View and manage upcoming and past clinical sessions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('list')}
              className={cn("rounded-lg h-9 px-4 font-bold text-xs uppercase tracking-widest", viewMode === 'list' ? "bg-card text-indigo-600 shadow-sm hover:bg-card" : "text-muted-foreground")}
            >
              <List size={16} className="mr-2" /> List
            </Button>
            <Button 
              variant={viewMode === 'calendar' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('calendar')}
              className={cn("rounded-lg h-9 px-4 font-bold text-xs uppercase tracking-widest", viewMode === 'calendar' ? "bg-card text-indigo-600 shadow-sm hover:bg-card" : "text-muted-foreground")}
            >
              <LayoutGrid size={16} className="mr-2" /> Calendar
            </Button>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest">
                <Plus size={20} className="mr-2" /> New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Schedule New Appointment</DialogTitle>
              </DialogHeader>
              <AppointmentForm 
                onSuccess={() => {
                  setOpen(false);
                  fetchAppointments();
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-card rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Zap size={20} className="fill-current" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Today</p>
            <p className="text-xl font-black text-foreground">{stats.today}</p>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-card rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">This Month</p>
            <p className="text-xl font-black text-foreground">{stats.month}</p>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-card rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <CircleDashed size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Scheduled</p>
            <p className="text-xl font-black text-foreground">{stats.pending}</p>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-card rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Completed</p>
            <p className="text-xl font-black text-foreground">{stats.completed}</p>
          </div>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search by client name or tag..." 
            className="pl-12 bg-card border-border h-12 rounded-2xl shadow-sm font-medium focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-3 h-12 bg-muted p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg text-[10px] font-black uppercase tracking-widest">All</TabsTrigger>
            <TabsTrigger value="Scheduled" className="rounded-lg text-[10px] font-black uppercase tracking-widest">Scheduled</TabsTrigger>
            <TabsTrigger value="Completed" className="rounded-lg text-[10px] font-black uppercase tracking-widest">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="p-24 flex flex-col items-center justify-center gap-6">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Loading your schedule...</p>
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarView appointments={filteredAppointments} />
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
              <div className="grid gap-6">
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
              <div className="grid gap-6">
                {apps.map(app => <AppointmentCard key={app.id} app={app} />)}
              </div>
            </div>
          ))}

          {filteredAppointments.length === 0 && (
            <div className="text-center py-32 bg-muted/30 rounded-[3rem] border-2 border-dashed border-border">
              <div className="w-20 h-20 bg-card rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <CalendarIcon className="text-muted-foreground" size={40} />
              </div>
              <p className="text-foreground font-black text-xl">No appointments found</p>
              <p className="text-muted-foreground mt-2 mb-8 font-medium">Try adjusting your search or schedule a new session.</p>
              <Button variant="outline" className="h-12 px-8 border-border hover:bg-card rounded-2xl font-bold" onClick={() => { setSearch(""); setStatusFilter("all"); setOpen(true); }}>
                Schedule First Session
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
          onComplete={fetchAppointments}
        />
      )}
    </div>
  );
};

export default AppointmentsPage;