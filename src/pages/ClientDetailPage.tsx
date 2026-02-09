import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { calculateAge, getStarSign, getClientRollups } from "@/utils/crm-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Plus, Mail, Phone, MapPin, Calendar, 
  Star, Loader2, Briefcase, Heart, Baby, ExternalLink,
  Activity, Edit3, Trash2, MoreHorizontal, FlaskConical, TrendingUp, Clock, Brain, ArrowUpRight, ArrowDownRight
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
import Breadcrumbs from "@/components/crm/Breadcrumbs";
import { useRecentClients } from "@/hooks/use-recent-clients";

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [appOpen, setAppOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { addRecentClient } = useRecentClients();

  const fetchClientData = async () => {
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (clientError) throw clientError;

      const { data: appData, error: appError } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', id)
        .order('date', { ascending: false });

      if (appError) throw appError;

      const mappedClient = {
        ...clientData,
        born: clientData.born ? new Date(clientData.born) : null,
        suburb: clientData.suburbs || []
      } as unknown as Client;

      setClient(mappedClient);
      addRecentClient({ id: mappedClient.id, name: mappedClient.name });

      setAppointments((appData || []).map(a => ({
        ...a,
        date: new Date(a.date)
      })) as unknown as Appointment[]);

    } catch (err) {
      console.error("Error fetching client details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!confirm("Are you sure you want to delete this client? This will remove all their appointments too.")) return;
    
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Client deleted successfully");
      navigate('/clients');
    } catch (err: any) {
      showError(err.message || "Failed to delete client");
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [id]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  if (!client) return <div className="p-12 text-center">Client not found</div>;

  const rollups = getClientRollups(appointments);
  
  const boltScores = appointments
    .filter(app => app.bolt_score !== null && app.bolt_score !== undefined)
    .map(app => app.bolt_score as number);

  const totalBoltScores = boltScores.length;
  const averageBoltScore = totalBoltScores > 0 
    ? Math.round(boltScores.reduce((sum, score) => sum + score, 0) / totalBoltScores) 
    : null;
  
  const lastBoltScore = appointments.find(app => app.bolt_score !== null && app.bolt_score !== undefined)?.bolt_score || null;
  const previousBoltScore = appointments.filter(app => app.bolt_score !== null && app.bolt_score !== undefined)[1]?.bolt_score || null;

  const coherenceScores = appointments
    .filter(app => app.coherence_score !== null && app.coherence_score !== undefined)
    .map(app => app.coherence_score as number);

  const totalCoherenceScores = coherenceScores.length;
  const averageCoherenceScore = totalCoherenceScores > 0 
    ? (coherenceScores.reduce((sum, score) => sum + score, 0) / totalCoherenceScores) 
    : null;
  
  const lastCoherenceScore = appointments.find(app => app.coherence_score !== null && app.coherence_score !== undefined)?.coherence_score || null;
  const previousCoherenceScore = appointments.filter(app => app.coherence_score !== null && app.coherence_score !== undefined)[1]?.coherence_score || null;

  const getCoherenceColor = (score: number | null) => {
    if (score === null) return "text-slate-400";
    const isCoherent = Math.abs(score - Math.round(score)) < 0.01;
    return isCoherent ? "text-emerald-600" : "text-amber-600";
  };

  const getTrendIcon = (current: number | null, previous: number | null, higherIsBetter: boolean = true) => {
    if (current === null || previous === null || current === previous) return null;
    const improved = higherIsBetter ? current > previous : current < previous;
    return improved ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-rose-500" />;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <Breadcrumbs 
        items={[
          { label: "Clients", path: "/clients" },
          { label: client.name }
        ]} 
      />

      <div className="flex items-center justify-between gap-4">
        <Link to="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={18} className="mr-2" /> Back to Clients
          </Button>
        </Link>
        <div className="flex gap-2">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white rounded-xl border-slate-200">
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
                    fetchClientData();
                  }} 
                />
              </DialogContent>
            </Dialog>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <MoreHorizontal size={20} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={handleDeleteClient}
                    >
                        <Trash2 size={16} className="mr-2" /> Delete Client
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-none shadow-lg bg-white rounded-2xl">
            <div className="h-24 bg-gradient-to-r from-indigo-600 to-indigo-500 relative">
                <div className="absolute bottom-0 left-6 translate-y-1/2 p-1 bg-white rounded-full shadow-md">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600 border-2 border-indigo-100">
                      {client.name.charAt(0)}
                    </div>
                </div>
            </div>
            <CardContent className="pt-14 px-6 pb-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{client.name}</h2>
                <p className="text-slate-500 font-medium">{client.pronouns || 'No pronouns set'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {client.born && (
                  <>
                    <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none px-3 py-1 rounded-full">
                      {calculateAge(client.born)} years old
                    </Badge>
                    <Badge variant="outline" className="flex gap-1 items-center px-3 py-1 border-slate-200 rounded-full">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      {getStarSign(client.born)}
                    </Badge>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-slate-900">Contact & Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.occupation && (
                <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <Briefcase size={16} />
                  </div>
                  <span className="text-slate-700">{client.occupation}</span>
                </div>
              )}
              {client.marital_status && (
                <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <Heart size={16} />
                  </div>
                  <span className="text-slate-700">{client.marital_status}</span>
                </div>
              )}
              {client.children && (
                <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <Baby size={16} />
                  </div>
                  <span className="text-slate-700">Children: {client.children}</span>
                </div>
              )}
              <hr className="border-slate-100" />
              <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <Mail size={16} />
                </div>
                <span className="text-slate-700">{client.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <Phone size={16} />
                </div>
                <span className="text-slate-700">{client.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <MapPin size={16} />
                </div>
                <div className="flex gap-1 flex-wrap text-slate-700">
                  {client.suburb.length > 0 ? client.suburb.map(s => <span key={s} className="mr-1">{s}</span>) : 'No suburb'}
                </div>
              </div>
              {client.born && (
                <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <Calendar size={16} />
                  </div>
                  <span className="text-slate-700">Born: {format(client.born, "MMMM d, yyyy")}</span>
                </div>
              )}
              {client.chatgpt_url && (
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full text-xs rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50" asChild>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-sm rounded-2xl bg-white border-t-4 border-indigo-500">
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
            
            <Card className="border-none shadow-sm rounded-2xl bg-white border-t-4 border-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                  <FlaskConical size={16} className="text-emerald-500" /> Avg. BOLT Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-3xl font-extrabold",
                    averageBoltScore === null ? "text-slate-400" : averageBoltScore >= 25 ? "text-emerald-600" : "text-amber-600"
                  )}>
                    {averageBoltScore !== null ? `${averageBoltScore}s` : 'N/A'}
                  </p>
                  {getTrendIcon(lastBoltScore, previousBoltScore)}
                </div>
                <p className="text-xs text-slate-400 mt-1">{totalBoltScores} recorded tests</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-white border-t-4 border-rose-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                  <Brain size={16} className="text-rose-500" /> Avg. Coherence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-3xl font-extrabold",
                    getCoherenceColor(averageCoherenceScore)
                  )}>
                    {averageCoherenceScore !== null ? averageCoherenceScore.toFixed(2) : 'N/A'}
                  </p>
                  {getTrendIcon(lastCoherenceScore, previousCoherenceScore)}
                </div>
                <p className="text-xs text-slate-400 mt-1">{totalCoherenceScores} recorded tests</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-white border-t-4 border-violet-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                  <TrendingUp size={16} className="text-violet-500" /> Last BOLT/Coh
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn(
                  "text-xl font-extrabold",
                  lastBoltScore === null ? "text-slate-400" : (lastBoltScore >= 25 ? "text-emerald-600" : "text-amber-600")
                )}>
                  {lastBoltScore !== null ? `BOLT: ${lastBoltScore}s` : 'N/A'}
                </p>
                <p className={cn(
                  "text-xl font-extrabold mt-1",
                  lastCoherenceScore === null ? "text-slate-400" : getCoherenceColor(lastCoherenceScore)
                )}>
                  {lastCoherenceScore !== null ? `Coh: ${lastCoherenceScore.toFixed(2)}` : 'N/A'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Latest recorded session</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center pt-4">
            <h3 className="text-xl font-bold text-slate-900">Appointments ({rollups.totalSessions})</h3>
            <Dialog open={appOpen} onOpenChange={setAppOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 rounded-xl h-10 px-4">
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
                    fetchClientData();
                  }} 
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {appointments.map(app => (
              <Link key={app.id} to={`/appointments/${app.id}`}>
                <Card className="hover:shadow-md transition-all border-slate-200 bg-white group rounded-2xl overflow-hidden cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="font-bold bg-slate-100 text-slate-600">{(app as any).display_id || app.id.slice(0,8)}</Badge>
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
            {appointments.length === 0 && (
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