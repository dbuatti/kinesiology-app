import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { groupAppointmentsByMonth } from "@/utils/crm-utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Loader2, Plus, Trash2, MoreVertical, ExternalLink, FlaskConical, Activity, Move, MoreHorizontal } from "lucide-react";
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
} from "@/components/ui/dropdown-menu";
import AppointmentForm from "@/components/crm/AppointmentForm";
import { Appointment } from "@/types/crm";
import { showSuccess, showError } from "@/utils/toast";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAppointments, useDeleteAppointment } from "@/hooks/use-crm-data";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface AppointmentWithClient extends Appointment {
  clients: { name: string; id: string };
}

const AppointmentsPage = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const { data: appointments, isLoading, error } = useAppointments();
  const { mutate: deleteAppointment, isLoading: isDeleting } = useDeleteAppointment();
  
  const debouncedSearch = useDebounce(search, 300);

  const filteredAppointments = useMemo(() => {
    return (appointments || []).filter(app => 
      app.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      app.clients.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      app.display_id?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      app.tag.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [appointments, debouncedSearch]);

  const grouped = useMemo(() => {
    return groupAppointmentsByMonth(filteredAppointments);
  }, [filteredAppointments]);

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    deleteAppointment(id, {
      onSuccess: () => {
        showSuccess("Appointment deleted successfully");
      },
      onError: (err: any) => {
        showError(err.message || "Failed to delete appointment");
      }
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Appointments</h1>
          <p className="text-slate-500">View and manage upcoming and past sessions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
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
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search by client, name, or tag..." 
            className="pl-10 bg-white border-slate-200 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500 font-medium">
          {filteredAppointments.length} {filteredAppointments.length === 1 ? 'session' : 'sessions'} found
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
          <p className="text-slate-400">Loading your schedule...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center text-red-600">Error loading appointments.</div>
      ) : (
        <div className="space-y-10">
          {grouped.map(([month, apps]) => (
            <div key={month} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <CalendarIcon size={18} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">{month}</h2>
                <div className="flex-1 h-[1px] bg-slate-100" />
              </div>
              <div className="grid gap-4">
                {apps.map(app => {
                  const hasBolt = app.bolt_score !== null && app.bolt_score !== undefined;
                  const hasCoherence = app.coherence_score !== null && app.coherence_score !== undefined;
                  const hasCogs = app.sagittal_plane_notes || app.frontal_plane_notes || app.transverse_plane_notes;
                  
                  return (
                    <Card key={app.id} className="border-slate-200 hover:border-indigo-200 transition-all group overflow-hidden relative">
                      <CardContent className="p-0">
                        <Link to={`/appointments/${app.id}`} className="block">
                          <div className="flex flex-col sm:flex-row sm:items-stretch">
                            <div className="p-6 flex-1 space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="font-bold text-xl text-slate-900 hover:text-indigo-600 flex items-center gap-2">
                                    {app.clients?.name}
                                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                    <span className="flex items-center gap-1.5 font-medium">
                                      <Clock size={14} className="text-indigo-500" />
                                      {format(app.date, "EEEE, d MMM • h:mm a")}
                                    </span>
                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none px-2 py-0">
                                      {app.tag}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={app.status === 'Completed' ? 'default' : 'outline'} 
                                    className={app.status === 'Completed' ? 'bg-emerald-500 hover:bg-emerald-600 border-none' : 'border-slate-200 text-slate-500'}
                                  >
                                    {app.status}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                                        <MoreHorizontal size={16} />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem 
                                        className="text-destructive focus:text-destructive flex items-center gap-2"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleDelete(app.id);
                                        }}
                                        disabled={isDeleting}
                                      >
                                        <Trash2 size={14} /> Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              
                              {app.goal && (
                                <div className="text-sm bg-slate-50 rounded-xl p-3 border border-slate-100">
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Session Goal</span>
                                  <p className="text-slate-700 leading-relaxed">{app.goal}</p>
                                </div>
                              )}

                              {/* Assessment Indicators */}
                              {(hasBolt || hasCoherence || hasCogs) && (
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assessments:</span>
                                  {hasBolt && (
                                    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none flex items-center gap-1">
                                      <FlaskConical size={12} />
                                      BOLT: {app.bolt_score}s
                                    </Badge>
                                  )}
                                  {hasCoherence && (
                                    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none flex items-center gap-1">
                                      <Activity size={12} />
                                      Coherence: {app.coherence_score?.toFixed(2)}
                                    </Badge>
                                  )}
                                  {hasCogs && (
                                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none flex items-center gap-1">
                                      <Move size={12} />
                                      Cogs Assessed
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
          {filteredAppointments.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CalendarIcon className="text-slate-300" size={32} />
              </div>
              <p className="text-slate-900 font-bold text-lg">No appointments yet</p>
              <p className="text-slate-500 mt-1 max-w-xs mx-auto">Once you schedule sessions with your clients, they will appear here grouped by month.</p>
              <Button 
                variant="outline" 
                className="mt-6 border-slate-200 hover:bg-white"
                onClick={() => setOpen(true)}
              >
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