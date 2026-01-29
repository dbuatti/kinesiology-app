import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Calendar, Clock, Target, Zap, 
  ExternalLink, Loader2, Trash2, Edit3, User
} from "lucide-react";
import { format } from "date-fns";
import { Appointment } from "@/types/crm";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import BoltTestSection from "@/components/crm/BoltTestSection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AppointmentForm from "@/components/crm/AppointmentForm";

interface AppointmentWithClient extends Appointment {
  clients: { name: string; id: string };
}

const AppointmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentWithClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [boltEnabled, setBoltEnabled] = useState(false);

  const fetchAppointmentData = async () => {
    if (!id) return;
    setLoading(true);
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
        .eq('id', id)
        .single();

      if (error) throw error;

      setAppointment({
        ...data,
        date: new Date(data.date),
      } as unknown as AppointmentWithClient);

      // Check if BOLT procedure is enabled
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: procedures } = await supabase
          .from('procedures')
          .select('enabled')
          .eq('user_id', user.id)
          .ilike('name', '%bolt%')
          .single();
        
        setBoltEnabled(procedures?.enabled ?? false);
      }

    } catch (err) {
      console.error("Error fetching appointment details:", err);
      showError("Failed to load appointment details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!id || !confirm("Are you sure you want to delete this appointment?")) return;

    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Appointment deleted successfully");
      navigate('/appointments');
    } catch (err: any) {
      showError(err.message || "Failed to delete appointment");
    }
  };

  useEffect(() => {
    fetchAppointmentData();
  }, [id]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  if (!appointment) return <div className="p-12 text-center">Appointment not found</div>;

  const clientLink = `/clients/${appointment.clients.id}`;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Link to="/appointments">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={18} className="mr-2" /> Back to Schedule
          </Button>
        </Link>
        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white">
                <Edit3 size={16} className="mr-2" /> Edit Session
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Appointment</DialogTitle>
              </DialogHeader>
              <AppointmentForm 
                onSuccess={() => {
                  setEditOpen(false);
                  fetchAppointmentData();
                }} 
              />
            </DialogContent>
          </Dialog>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDeleteAppointment}
          >
            <Trash2 size={16} className="mr-2" /> Delete
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-lg rounded-2xl bg-white">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="font-bold bg-slate-100 text-slate-600">
                  {appointment.display_id || appointment.id.slice(0, 8)}
                </Badge>
                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none">{appointment.tag}</Badge>
                <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    appointment.status === 'Completed' ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-700"
                )}>
                  {appointment.status}
                </span>
              </div>
              <CardTitle className="text-3xl font-extrabold text-slate-900 pt-2">
                {appointment.name || "Kinesiology Session"}
              </CardTitle>
            </div>
            <div className="text-right">
              <Link to={clientLink} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                <User size={16} /> {appointment.clients.name}
              </Link>
              <p className="text-xs text-slate-400 mt-1">Client Profile</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Calendar size={16} className="text-indigo-500" />
                {format(appointment.date, "EEEE, MMM d, yyyy")}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</p>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Clock size={16} className="text-indigo-500" />
                {format(appointment.date, "h:mm a")}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Goal</p>
              <p className="text-slate-700 font-medium truncate">{appointment.goal || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issue</p>
              <p className="text-slate-700 font-medium truncate">{appointment.issue || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-none rounded-2xl bg-slate-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                  <Target size={16} className="text-indigo-500" /> Session Focus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px] mb-1.5 tracking-widest">Session North Star</p>
                  <p className="text-slate-800 leading-relaxed">{appointment.session_north_star || appointment.goal || 'No North Star defined.'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px] mb-1.5 tracking-widest">Priority Pattern</p>
                  <p className="text-slate-800 leading-relaxed">{appointment.priority_pattern || 'No priority pattern identified.'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px] mb-1.5 tracking-widest">Modes & Balances</p>
                  <p className="text-slate-800 leading-relaxed">{appointment.modes_balances || 'No modes or balances logged.'}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-none rounded-2xl bg-slate-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                  <Zap size={16} className="text-indigo-500" /> Acupoints & Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px] mb-1.5 tracking-widest">Acupoints</p>
                  <p className="text-indigo-600 font-mono font-medium tracking-tight bg-white p-2 rounded-lg border border-slate-100">{appointment.acupoints || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px] mb-1.5 tracking-widest">Session Notes</p>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{appointment.notes || 'No general notes.'}</p>
                </div>
                {appointment.additional_notes && (
                  <div>
                    <p className="font-bold text-slate-400 uppercase text-[10px] mb-1.5 tracking-widest">Additional Notes</p>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{appointment.additional_notes}</p>
                  </div>
                )}
                {appointment.journal && (
                  <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    <p className="font-bold text-amber-800 uppercase text-[10px] mb-1.5 tracking-widest">Journal Entry</p>
                    <p className="text-amber-900 leading-relaxed whitespace-pre-wrap">{appointment.journal}</p>
                  </div>
                )}
                {appointment.notion_link && (
                  <Button variant="outline" size="sm" className="w-full text-xs rounded-xl" asChild>
                    <a href={appointment.notion_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={14} className="mr-2" /> View Notion Link
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {boltEnabled && (
        <BoltTestSection
          appointmentId={appointment.id}
          initialBoltScore={appointment.bolt_score}
          onUpdate={fetchAppointmentData}
        />
      )}
    </div>
  );
};

export default AppointmentDetailPage;