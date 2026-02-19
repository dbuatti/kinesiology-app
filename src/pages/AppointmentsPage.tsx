import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { groupAppointmentsByMonth } from "@/utils/crm-utils";
import { format, isToday } from "date-fns";
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
  Filter
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
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { APPOINTMENT_STATUSES } from "@/data/appointment-data";
import Breadcrumbs from "@/components/crm/Breadcrumbs";
import { Input } from "@/components/ui/input";

interface AppointmentWithClient extends Appointment {
  clients: { name: string; id: string };
}

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

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

      const mapped = (data || []).map(a => ({
        ...a,
        date: new Date(a.date),
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

  const filteredAppointments = appointments.filter(app => 
    app.clients?.name.toLowerCase().includes(search.toLowerCase()) ||
    app.tag.toLowerCase().includes(search.toLowerCase()) ||
    app.name?.toLowerCase().includes(search.toLowerCase())
  );

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

    return (
      <Card 
        className={cn(
          "border-slate-200 transition-all duration-300 group overflow-hidden relative rounded-[2rem]",
          isTodaySession 
            ? "border-indigo-300 shadow-xl shadow-indigo-100 ring-2 ring-indigo-50 bg-white" 
            : "bg-white hover:shadow-xl hover:border-slate-300"
        )}
      >
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row sm:items-stretch">
            <Link to={`/appointments/${app.id}`} className="p-8 flex-1 space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-2xl text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {app.clients?.name}
                    </h3>
                    {isTodaySession && (
                      <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="flex items-center gap-2 font-bold text-slate-500">
                      <Clock size={16} className={cn(isTodaySession ? "text-rose-500" : "text-indigo-500")} />
                      {format(app.date, isTodaySession ? "h:mm a" : "EEEE, d MMM • h:mm a")}
                    </span>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest border-none px-3 py-1">
                      {app.tag}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {app.goal && (
                <div className="text-sm bg-slate-50/50 rounded-2xl p-4 border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Session Goal</span>
                  <p className="text-slate-700 font-medium leading-relaxed line-clamp-2 italic">"{app.goal}"</p>
                </div>
              )}

              {hasAnyAssessment && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {hasBolt && (
                    <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                      <FlaskConical size={12} /> BOLT: {app.bolt_score}s
                    </Badge>
                  )}
                  {hasCoherence && (
                    <Badge className="bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                      <Activity size={12} /> COH: {app.coherence_score?.toFixed(2)}
                    </Badge>
                  )}
                  {hasCogs && (
                    <Badge className="bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                      <Move size={12} /> COGS
                    </Badge>
                  )}
                </div>
              )}
            </Link>

            <div className="p-8 flex flex-col justify-between items-end border-t sm:border-t-0 sm:border-l border-slate-100 bg-slate-50/30 group-hover:bg-indigo-50/20 transition-colors">
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant={isCompleted ? 'default' : 'outline'} 
                      className={cn(
                        "font-black h-9 text-[10px] uppercase tracking-widest rounded-xl shadow-sm px-4",
                        isCompleted ? 'bg-emerald-600 hover:bg-emerald-700 border-none text-white' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                      )}
                    >
                      {app.status}
                      <ChevronDown size={14} className="ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-2xl border-none">
                    {APPOINTMENT_STATUSES.map(status => (
                      <DropdownMenuItem 
                        key={status}
                        onClick={() => updateStatus(app.id, status)}
                        className={cn(
                          "flex items-center justify-between rounded-xl py-2.5 px-4 cursor-pointer",
                          app.status === status && "bg-indigo-50 text-indigo-600 font-black"
                        )}
                      >
                        {status}
                        {app.status === status && <CheckCircle2 size={16} className="text-indigo-600" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all">
                      <MoreVertical size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl p-2 shadow-2xl border-none">
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
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Session ID
                </span>
                <span className="text-xs font-bold text-slate-600 font-mono">
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
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Appointments</h1>
          <p className="text-slate-500 font-medium mt-1">View and manage upcoming and past clinical sessions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest">
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

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input 
          placeholder="Search by client name or tag..." 
          className="pl-12 bg-white border-slate-200 h-12 rounded-2xl shadow-sm font-medium focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="p-24 flex flex-col items-center justify-center gap-6">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading your schedule...</p>
        </div>
      ) : (
        <div className="space-y-16">
          {todaySessions.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0 shadow-sm">
                  <Zap size={24} className="fill-current" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Today's Sessions</h2>
                <div className="flex-1 h-[2px] bg-rose-100 rounded-full opacity-50" />
              </div>
              <div className="grid gap-6">
                {todaySessions.map(app => <AppointmentCard key={app.id} app={app} />)}
              </div>
            </div>
          )}

          {grouped.map(([month, apps]) => (
            <div key={month} className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-sm">
                  <CalendarIcon size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{month}</h2>
                <div className="flex-1 h-[2px] bg-slate-200 rounded-full opacity-50" />
              </div>
              <div className="grid gap-6">
                {apps.map(app => <AppointmentCard key={app.id} app={app} />)}
              </div>
            </div>
          ))}

          {filteredAppointments.length === 0 && (
            <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <CalendarIcon className="text-slate-300" size={40} />
              </div>
              <p className="text-slate-900 font-black text-xl">No appointments found</p>
              <p className="text-slate-500 mt-2 mb-8">Try adjusting your search or schedule a new session.</p>
              <Button variant="outline" className="h-12 px-8 border-slate-200 hover:bg-white rounded-2xl font-bold" onClick={() => { setSearch(""); setOpen(true); }}>
                Schedule First Session
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;