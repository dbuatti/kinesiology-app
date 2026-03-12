import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getClientRollups } from "@/utils/crm-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, 
  Loader2, Briefcase, Heart, Baby,
  Activity, Edit3, Trash2, MoreHorizontal, FlaskConical, TrendingUp, Clock, Brain,
  LayoutDashboard, History, ArrowRight, Copy, Check, Sparkles, Plus, Link as LinkIcon
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientProgressTab from "@/components/crm/ClientProgressTab";
import ClientProfileCard from "@/components/crm/ClientProfileCard";

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [appOpen, setAppOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [aiCopying, setAiCopying] = useState(false);
  const [linkCopying, setLinkCopying] = useState(false);
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
        suburbs: clientData.suburbs || []
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

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyOnboardingLink = () => {
    if (!client) return;
    setLinkCopying(true);
    const url = `${window.location.origin}/onboarding/${client.id}`;
    navigator.clipboard.writeText(url);
    showSuccess("Onboarding link copied to clipboard!");
    setTimeout(() => setLinkCopying(false), 2000);
  };

  const handleCopyForAI = () => {
    if (!client) return;
    setAiCopying(true);

    const latestApp = appointments[0];
    
    let prompt = `
I am a Kinesiology practitioner analyzing a client case. Please provide clinical insights based on the following data:

CLIENT PROFILE:
- Name: ${client.name}
- History: ${client.journal || 'N/A'}

LATEST SESSION FINDINGS (${latestApp ? format(latestApp.date, "MMM d, yyyy") : 'No sessions'}):
- Goal: ${latestApp?.goal || 'N/A'}
- Primary Issue: ${latestApp?.issue || 'N/A'}
- BOLT Score: ${latestApp?.bolt_score ? `${latestApp.bolt_score}s` : 'N/A'}
- Coherence: ${latestApp?.coherence_score ? latestApp.coherence_score.toFixed(2) : 'N/A'}
- Acupoints Used: ${latestApp?.acupoints || 'N/A'}

Please analyze the relationship between the respiratory (BOLT), autonomic (Coherence), and emotional findings.
`;

    navigator.clipboard.writeText(prompt.trim());
    showSuccess("Case data formatted and copied for AI analysis!");
    setTimeout(() => setAiCopying(false), 2000);
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

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-6">
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
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100 rounded-xl font-bold"
              onClick={handleCopyOnboardingLink}
            >
              {linkCopying ? <Check size={16} className="mr-2" /> : <LinkIcon size={16} className="mr-2" />}
              Copy Onboarding Link
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100 rounded-xl font-bold"
              onClick={handleCopyForAI}
            >
              {aiCopying ? <Check size={16} className="mr-2 text-emerald-500" /> : <Sparkles size={16} className="mr-2" />}
              Copy Case for AI
            </Button>
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

      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 bg-slate-200/50 p-1.5 rounded-2xl mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 font-black uppercase tracking-wider text-[10px]">
            <LayoutDashboard size={14} /> Overview
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 font-black uppercase tracking-wider text-[10px]">
            <History size={14} /> Appointments
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 font-black uppercase tracking-wider text-[10px]">
            <TrendingUp size={14} /> Progress & Protocols
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <ClientProfileCard client={client} />

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
                  <div className="flex items-center justify-between group/contact p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <Mail size={16} />
                      </div>
                      <span className="text-slate-700">{client.email || 'No email'}</span>
                    </div>
                    {client.email && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover/contact:opacity-100 transition-opacity" onClick={() => handleCopy(client.email, 'email')}>
                        {copiedField === 'email' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center justify-between group/contact p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <Phone size={16} />
                      </div>
                      <span className="text-slate-700">{client.phone || 'No phone'}</span>
                    </div>
                    {client.phone && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover/contact:opacity-100 transition-opacity" onClick={() => handleCopy(client.phone, 'phone')}>
                        {copiedField === 'phone' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <MapPin size={16} />
                    </div>
                    <div className="flex gap-1 flex-wrap text-slate-700">
                      {client.suburbs.length > 0 ? client.suburbs.map(s => <span key={s} className="mr-1">{s}</span>) : 'No suburb'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <FlaskConical size={16} className="text-emerald-500" /> Latest BOLT
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={cn(
                      "text-3xl font-extrabold",
                      appointments.find(a => a.bolt_score)?.bolt_score ? (appointments.find(a => a.bolt_score)!.bolt_score! >= 25 ? "text-emerald-600" : "text-rose-600") : "text-slate-300"
                    )}>
                      {appointments.find(a => a.bolt_score)?.bolt_score ? `${appointments.find(a => a.bolt_score)!.bolt_score}s` : "N/A"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Target: 40s</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-2xl bg-white border-t-4 border-rose-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                      <Brain size={16} className="text-rose-500" /> Latest Coherence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-extrabold text-rose-600">
                      {appointments.find(a => a.coherence_score)?.coherence_score?.toFixed(2) || "N/A"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Autonomic sync ratio</p>
                  </CardContent>
                </Card>
              </div>

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

              <div className="flex justify-between items-center pt-4">
                <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
                <Button variant="ghost" size="sm" className="text-indigo-600 font-bold" onClick={() => setSearchParams({ tab: "appointments" })}>
                  View All <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>

              <div className="grid gap-4">
                {appointments.slice(0, 3).map(app => (
                  <Link key={app.id} to={`/appointments/${app.id}`}>
                    <Card className="hover:shadow-md transition-all border-slate-200 bg-white group rounded-2xl overflow-hidden cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="font-bold bg-slate-100 text-slate-600">{(app as any).display_id || app.id.slice(0,8)}</Badge>
                              <span className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">{app.name || format(app.date, "MMM d, yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-indigo-500" /> {format(app.date, "MMM d")}</span>
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
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-900">Session History</h3>
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
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <ClientProgressTab 
            client={client} 
            appointments={appointments} 
            onRefresh={fetchClientData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDetailPage;