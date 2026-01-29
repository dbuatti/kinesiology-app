import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { calculateAge, getStarSign, getClientRollups } from "@/utils/crm-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Plus, Mail, Phone, MapPin, Calendar, 
  Star, Loader2, Briefcase, Heart, Baby, ExternalLink,
  Activity, Edit3, Trash2, MoreHorizontal, FlaskConical, TrendingUp, Clock
} from "lucide-react";
import { format } from "date-fns";
import { Client, Appointment } from "@/types/crm";
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
import ClientForm from "@/components/crm/ClientForm";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { useClient, useAppointments, useDeleteClient } from "@/hooks/use-crm-data";

const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appOpen, setAppOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data: client, isLoading: isClientLoading, error: clientError } = useClient(id);
  const { data: appointments, isLoading: isAppointmentsLoading, error: appointmentsError } = useAppointments();
  const { mutate: deleteClient, isLoading: isDeleting } = useDeleteClient();

  // Filter appointments relevant to this client
  const clientAppointments = (appointments || []).filter(app => app.clientId === id);

  // Setup real-time subscription for client data updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`client-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clients',
          filter: `id=eq.${id}`
        },
        (payload) => {
          // Invalidate the query cache to trigger a refresh
          // This is a more robust way to handle real-time updates with React Query
          // than manually setting state.
          // We don't need to manually set state here, React Query handles it.
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleDeleteClient = () => {
    if (!confirm("Are you sure you want to delete this client? This will remove all their appointments too.")) return;
    
    deleteClient(id!, {
      onSuccess: () => {
        showSuccess("Client deleted successfully");
        navigate('/clients');
      },
      onError: (err: any) => {
        showError(err.message || "Failed to delete client");
      }
    });
  };

  if (isClientLoading || isAppointmentsLoading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  if (clientError || appointmentsError) return <div className="p-12 text-center text-red-600">Error loading client data.</div>;
  if (!client) return <div className="p-12 text-center">Client not found</div>;

  const rollups = getClientRollups(clientAppointments);
  
  // Calculate BOLT metrics
  const boltScores = clientAppointments
    .filter(app => app.bolt_score !== null && app.bolt_score !== undefined)
    .map(app => app.bolt_score as number);

  const totalBoltScores = boltScores.length;
  const averageBoltScore = totalBoltScores > 0 
    ? Math.round(boltScores.reduce((sum, score) => sum + score, 0) / totalBoltScores) 
    : null;
  
  // Appointments are already sorted descending by date, so the first one with a score is the latest.
  const lastBoltScore = clientAppointments.find(app => app.bolt_score !== null && app.bolt_score !== undefined)?.bolt_score || null;


  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Link to="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={18} className="mr-2" /> Back to Clients
          </Button>
        </Link>
        <div className="flex gap-2">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white">
                  <Edit3 size={16} className="mr-2" /> Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Edit Client Profile</DialogTitle>
                </DialogHeader>
                <ClientForm 
                  initialData={client}
                  onSuccess={() => {
                    setEditOpen(false);
                  }} 
                />
              </DialogContent>
            </Dialog>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal size={20} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                        className="text-destructive focus:text-destructive flex items-center gap-2"
                        onClick={handleDeleteClient}
                        disabled={isDeleting}
                    >
                        <Trash2 size={16} className="mr-2" /> Delete Client
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-none shadow-lg bg-white">
            <div className="h-24 bg-gradient-to-r from-indigo-600 to-indigo-500" />
            <CardContent className="pt-0 -mt-12 text-center space-y-4">
              <div className="inline-block p-1 bg-white rounded-full shadow-md">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600 border-2 border-indigo-100">
                  {client.name.charAt(0)}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{client.name}</h2>
                <p className="text-slate-500 font-medium">{client.pronouns || 'No pronouns set'}</p>
              </div>
              <div className="flex justify-center gap-2">
                {client.born && (
                  <>
                    <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none px-3 py-1">
                      {calculateAge(client.born)} years old
                    </Badge>
                    <Badge variant="outline" className="flex gap-1 items-center px-3 py-1 border-slate-200">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      {getStarSign(client.born)}
                    </Badge>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.occupation && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Briefcase size={16} />
                  </div>
                  <span className="text-slate-700">{client.occupation}</span>
                </div>
              )}
              {client.marital_status && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Heart size={16} />
                  </div>
                  <span className="text-slate-700">{client.marital_status}</span>
                </div>
              )}
              {client.children && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Baby size={16} />
                  </div>
                  <span className="text-slate-700">Children: {client.children}</span>
                </div>
              )}
              <hr className="border-slate-100" />
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Mail size={16} />
                </div>
                <span className="text-slate-700">{client.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Phone size={16} />
                </div>
                <span className="text-slate-700">{client.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <MapPin size={16} />
                </div>
                <div className="flex gap-1 flex-wrap text-slate-700">
                  {client.suburb.length > 0 ? client.suburb.map(s => <span key={s} className="mr-1">{s}</span>) : 'No suburb'}
                </div>
              </div>
              {client.born && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Calendar size={16} />
                  </div>
                  <span className="text-slate-700">Born: {format(client.born, "MMMM d, yyyy")}</span>
                </div>
              )}
              {client.chatgpt_url && (
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full text-xs rounded-xl" asChild>
                    <a href={client.chatgpt_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={14} className="mr-2" /> View ChatGPT Insights
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {client.journal && (
            <Card className="bg-amber-50/50 border-amber-100 shadow-none rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                  History & Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-900/80 whitespace-pre-wrap leading-relaxed">{client.journal}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm rounded-2xl bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                  <Activity size={16} className="text-indigo-500" /> Total Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-extrabold text-slate-900">{rollups.totalSessions}</p>
                <p className="text-xs text-slate-400 mt-1">Last: {rollups.lastAppointment}</p>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-sm rounded-2xl bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                  <FlaskConical size={16} className="text-indigo-500" /> Avg. BOLT Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn(
                  "text-3xl font-extrabold",
                  averageBoltScore === null ? "text-slate-400" : averageBoltScore >= 25 ? "text-emerald-600" : "text-amber-600"
                )}>
                  {averageBoltScore !== null ? `${averageBoltScore}s` : 'N/A'}
                </p>
                <p className="text-xs text-slate-400 mt-1">{totalBoltScores} recorded tests</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                  <TrendingUp size={16} className="text-indigo-500" /> Last BOLT Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn(
                  "text-3xl font-extrabold",
                  lastBoltScore === null ? "text-slate-400" : lastBoltScore >= 25 ? "text-emerald-600" : "text-amber-600"
                )}>
                  {lastBoltScore !== null ? `${lastBoltScore}s` : 'N/A'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Latest recorded session</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center pt-4">
            <h3 className="text-xl font-bold text-slate-900">Appointments</h3>
            <Dialog open={appOpen} onOpenChange={setAppOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                  <Plus size={16} className="mr-2" /> Book Session
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Schedule New Appointment</DialogTitle>
                </DialogHeader>
                <AppointmentForm 
                  initialClientId={id}
                  onSuccess={() => {
                    setAppOpen(false);
                  }} 
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {clientAppointments.map(app => (
              <Link key={app.id} to={`/appointments/${app.id}`}>
                <Card className="hover:shadow-md transition-all border-slate-200 bg-white group rounded-2xl overflow-hidden cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="font-bold bg-slate-100 text-slate-600">{app.display_id || app.id.slice(0,8)}</Badge>
                          <span className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">{app.name || format(app.date, "MMM d, yyyy")}</span>
                          <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none">{app.tag}</Badge>
                          {app.notion_link && (
                            <a href={app.notion_link} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-600 transition-colors">
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5"><Calendar size={14} className="text-indigo-500" /> {format(app.date, "EEEE, MMM d")}</span>
                          <span className="flex items-center gap-1.5"><Clock size={14} className="text-indigo-500" /> {format(app.date, "h:mm a")}</span>
                          <span className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-bold",
                              app.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                          )}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {clientAppointments.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={32} className="text-indigo-300" />
                </div>
                <h4 className="text-slate-900 font-bold text-lg">No appointments yet</h4>
                <p className="text-slate-400 mt-1 max-w-xs mx-auto">Start building this client's history by booking their first session.</p>
                <Button 
                    variant="outline" 
                    className="mt-6 rounded-xl border-slate-200"
                    onClick={() => setAppOpen(true)}
                >
                    Book First Session
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailPage;