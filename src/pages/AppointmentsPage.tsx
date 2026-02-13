import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { groupAppointmentsByMonth } from "@/utils/crm-utils";
import { format, isToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Loader2, Plus, Trash2, MoreVertical, ExternalLink, FlaskConical, Activity, Move, TrendingUp, Brain, Palette, Heart, CheckCircle2, ChevronDown, Zap } from "lucide-react";
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

interface AppointmentWithClient extends Appointment {
  clients: { name: string; id: string };
}

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

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

  const todaySessions = appointments.filter(app => isToday(app.date));
  const otherSessions = appointments.filter(app => !isToday(app.date));
  const grouped = groupAppointmentsByMonth(otherSessions);

  const AppointmentCard = ({ app }: { app: AppointmentWithClient }) => {
    const hasBolt = app.bolt_score !== null && app.bolt_score !== undefined;
    const hasCoherence = app.coherence_score !== null && app.coherence_score !== undefined;
    const hasCogs = app.sagittal_plane_notes || app.frontal_plane_notes || app.transverse_plane_notes;
    const hasFakuda = !!app.fakuda_notes;
    const hasRhombergs = !!app.sharpened_rhombergs_notes;
    const hasFrontalLobe = !!app.frontal_lobe_notes;
    const hasAnyAssessment = hasBolt || hasCoherence || hasCogs || hasFakuda || hasRhombergs || hasFrontalLobe;
    const isCompleted = app.status === 'Completed';
    const isTodaySession = isToday(app.date);

    return (
      <Card 
        className={cn(
          "border-slate-200 transition-all group overflow-hidden relative rounded-2xl",
          isTodaySession ? "border-indigo-300 shadow-md ring-1 ring-indigo-100" : "bg-white hover:shadow-lg"
        )}
      >
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row sm:items-stretch">
            <Link to={`/appointments/${app.id}`} className="p-6 flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-xl text-slate-900 group-hover:text-indigo-600 flex items-center gap-2 transition-colors">
                    {app.clients?.name}
                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <Clock size={14} className="text-indigo-500" />
                      {format(app.date, isTodaySession ? "h:mm a" : "EEEE, d MMM • h:mm a")}
                    </span>
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none px-2 py-0">
                      {app.tag}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {app.goal && (
                <div className="text-sm bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Session Goal</span>
                  <p className="text-slate-700 leading-relaxed line-clamp-2">{app.goal}</p>
                </div>
              )}

              {hasAnyAssessment && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  {hasBolt && (
                    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none flex items-center gap-1 text-[10px] font-bold">
                      <FlaskConical size={10} /> BOLT: {app.bolt_score}s
                    </Badge>
                  )}
                  {hasCoherence && (
                    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none flex items-center gap-1 text-[10px] font-bold">
                      <Activity size={10} /> COH: {app.coherence_score?.toFixed(2)}
                    </Badge>
                  )}
                  {hasCogs && <Badge className="bg-purple-100 text-purple-700 border-none text-[10px] font-bold">COGS</Badge>}
                </div>
              )}
            </Link>

            <div className="p-6 flex flex-col justify-between items-end border-t sm:border-t-0 sm:border-l border-slate-100 bg-slate-50/30">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant={isCompleted ? 'default' : 'outline'} 
                      className={cn(
                        "font-bold h-8 text-xs rounded-lg shadow-sm",
                        isCompleted ? 'bg-emerald-600 hover:bg-emerald-700 border-none text-white' : 'border-slate-300 text-slate-600 bg-white hover:bg-slate-50'
                      )}
                    >
                      {app.status}
                      <ChevronDown size={14} className="ml-1 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {APPOINTMENT_STATUSES.map(status => (
                      <DropdownMenuItem 
                        key={status}
                        onClick={() => updateStatus(app.id, status)}
                        className={cn(
                          "flex items-center justify-between",
                          app.status === status && "bg-slate-100 font-bold"
                        )}
                      >
                        {status}
                        {app.status === status && <CheckCircle2 size={14} className="text-emerald-600" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-lg">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/appointments/${app.id}`} className="flex items-center gap-2">
                        <ExternalLink size={14} /> View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive flex items-center gap-2"
                      onClick={() => deleteAppointment(app.id)}
                    >
                      <Trash2 size={14} /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                ID: {app.display_id || app.id.slice(0,8)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-6">
      <Breadcrumbs items={[{ label: "Appointments" }]} />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Appointments</h1>
          <p className="text-slate-500">View and manage upcoming and past sessions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 rounded-xl h-11 px-6">
              <Plus size={18} className="mr-2" /> New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
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

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
          <p className="text-slate-400">Loading your schedule...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Today's Sessions Section */}
          {todaySessions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                  <Zap size={20} className="fill-current" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Today's Sessions</h2>
                <div className="flex-1 h-[2px] bg-rose-100 rounded-full" />
              </div>
              <div className="grid gap-4">
                {todaySessions.map(app => <AppointmentCard key={app.id} app={app} />)}
              </div>
            </div>
          )}

          {grouped.map(([month, apps]) => (
            <div key={month} className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <CalendarIcon size={20} />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{month}</h2>
                <div className="flex-1 h-[2px] bg-slate-200 rounded-full" />
              </div>
              <div className="grid gap-4">
                {apps.map(app => <AppointmentCard key={app.id} app={app} />)}
              </div>
            </div>
          ))}

          {appointments.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CalendarIcon className="text-slate-300" size={32} />
              </div>
              <p className="text-slate-900 font-bold text-lg">No appointments yet</p>
              <Button variant="outline" className="mt-6 border-slate-200 hover:bg-white rounded-xl" onClick={() => setOpen(true)}>
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