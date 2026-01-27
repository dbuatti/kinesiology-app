import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { groupAppointmentsByMonth } from "@/utils/crm-utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Tag, Loader2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AppointmentForm from "@/components/crm/AppointmentForm";
import { Appointment } from "@/types/crm";

interface AppointmentWithClient extends Appointment {
  clients: { name: string };
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

  useEffect(() => {
    fetchAppointments();
  }, []);

  const grouped = groupAppointmentsByMonth(appointments);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM_Appointments</h1>
          <p className="text-slate-500">View and manage upcoming and past sessions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
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
        <div className="p-12 flex justify-center">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(([month, apps]) => (
            <div key={month} className="space-y-4">
              <h2 className="text-lg font-bold border-b pb-2 flex items-center gap-2">
                 <CalendarIcon size={18} className="text-indigo-500" />
                 {month}
              </h2>
              <div className="grid gap-4">
                {apps.map(app => (
                  <Card key={app.id} className="hover:border-indigo-200 transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                             <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none font-bold">
                                {(app as any).display_id || app.id.slice(0, 8)}
                             </Badge>
                             <span className="font-bold text-lg">{(app as any).clients?.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} />
                              {format(app.date, "EEEE, d MMM • h:mm a")}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Tag size={14} />
                              {app.tag}
                            </span>
                          </div>
                        </div>
                        <Badge variant={app.status === 'Completed' ? 'default' : 'outline'} className={app.status === 'Completed' ? 'bg-emerald-500' : ''}>
                          {app.status}
                        </Badge>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-50 text-sm text-slate-600">
                         <p><strong>Goal:</strong> {app.goal}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          {appointments.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400">No appointments scheduled yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;