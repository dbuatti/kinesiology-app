import { useState, useEffect, useMemo, type MouseEvent } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { getClientRollups } from "@/utils/crm-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Mail, Phone, MapPin,
  Loader2, Briefcase, Heart, Baby,
  Activity, Edit3, Trash2, MoreHorizontal, FlaskConical, TrendingUp, Brain,
  LayoutDashboard, History, ArrowRight, Sparkles, Plus, Link as LinkIcon,
  Zap, Send, ShieldCheck, ExternalLink, RefreshCw, ShieldAlert, Info, User, CreditCard, LayoutGrid,
  CalendarClock
} from "lucide-react";
import { format } from "date-fns";
import { Client, Appointment } from "@/types/crm";
import { parseClientJournal } from "@/utils/journal-helper";
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
import ClientForm from "@/components/crm/ClientForm";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

import { useRecentClients } from "@/hooks/use-recent-clients";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientProgressTab from "@/components/crm/ClientProgressTab";
import ClientProfileCard from "@/components/crm/ClientProfileCard";
import AppLayout from "@/components/crm/AppLayout";
import { generateAICasePrompt } from "@/utils/summary-generator";
import QuickAssessmentModal from "@/components/crm/QuickAssessmentModal";
import PageHeader from "@/components/shared/PageHeader";
import { useClientGridData } from "@/hooks/useClientGridData";
import ClientGridSummaryTab from "@/components/crm/ClientGridSummaryTab";
import ClientAppointmentCard from "@/components/crm/ClientAppointmentCard";

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
  const [aiCopying, setAiCopying] = useState(false);
  const [linkCopying, setLinkCopying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [syncingKit, setSyncingKit] = useState(false);
  const [syncingStripe, setSyncingStripe] = useState(false);
  const [syncingNotion, setSyncingNotion] = useState(false);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const [assessmentModal, setAssessmentModal] = useState<{ open: boolean; type: 'bolt' | 'coherence' } | null>(null);
  const [contactLogOpen, setContactLogOpen] = useState(false);
  const [contactLogNote, setContactLogNote] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const { addRecentClient } = useRecentClients();
  const { gridFor } = useClientGridData(appointments);

  const nextAppointment = useMemo(() => {
    const now = new Date();
    const upcoming = appointments
      .filter(a => a.date >= now && a.status !== 'Cancelled')
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return upcoming[0] || null;
  }, [appointments]);

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
        .neq('status', 'Cancelled')
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

  const handleGeneratePaymentLink = async (e: MouseEvent, app: Appointment) => {
    e.preventDefault();
    e.stopPropagation();
    if (!client) return;
    
    setGeneratingLink(app.id);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-manager', {
        body: { 
          action: 'create-checkout', 
          clientId: client.id,
          appointmentId: app.id,
          clientData: client
        }
      });

      if (error) throw error;

      if (data.url) {
        // Update the appointment with the link silently
        await supabase.from('appointments').update({ payment_link: data.url }).eq('id', app.id);
        window.open(data.url, '_blank');
        showSuccess("Payment link generated!");
        fetchClientData();
      }
    } catch (err: any) {
      showError(err.message || "Failed to generate link. Ensure client is synced to Stripe.");
    } finally {
      setGeneratingLink(null);
    }
  };

  const handleSyncToStripe = async () => {
    if (!client) return;
    setSyncingStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-manager', {
        body: { 
          action: 'sync-customer', 
          clientId: client.id,
          clientData: client
        }
      });

      if (error) throw error;

      if (data.stripeCustomerId) {
        await supabase
          .from('clients')
          .update({ stripe_customer_id: data.stripeCustomerId })
          .eq('id', client.id);
        
        showSuccess(`Synced ${client.name} to Stripe!`);
        fetchClientData();
      }
    } catch (err: any) {
      showError(err.message || "Failed to sync to Stripe.");
    } finally {
      setSyncingStripe(false);
    }
  };

  const handleSyncToNotion = async () => {
    if (!client) return;
    setSyncingNotion(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-notion', {
        body: {
          clientId: client.id,
          origin: window.location.origin
        }
      });

      if (error) throw error;

      showSuccess(`Synced ${client.name} to Notion Client Database!`);
      fetchClientData();
    } catch (err: any) {
      showError(err.message || "Failed to sync to Notion.");
    } finally {
      setSyncingNotion(false);
    }
  };

  const handleCopyOnboardingLink = () => {
    if (!client) return;
    setLinkCopying(true);
    const url = `${window.location.origin}/onboarding/${client.id}`;
    navigator.clipboard.writeText(url);
    showSuccess("Onboarding link copied to clipboard!");
    setTimeout(() => setLinkCopying(false), 2000);
  };

  const handleLogContact = async () => {
    if (!client || !contactLogNote.trim()) return;
    setSavingContact(true);
    try {
      const currentLog = (client as any).contact_log || [];
      const entry = { timestamp: new Date().toISOString(), note: contactLogNote.trim() };
      const updatedLog = [...currentLog, entry];
      const { error } = await supabase
        .from('clients')
        .update({ contact_log: updatedLog })
        .eq('id', client.id);
      if (error) throw error;
      setContactLogNote("");
      setContactLogOpen(false);
      showSuccess("Contact logged");
      fetchClientData();
    } catch (err: any) {
      showError(err.message || "Failed to log contact");
    } finally {
      setSavingContact(false);
    }
  };

  const handleSendOnboardingEmail = async () => {
    if (!client) return;
    setSendingEmail(true);
    try {
      // Find the soonest upcoming unpaid paid appointment to pass as context
      const relevantApp = appointments
        .filter(a => a.is_paid && !a.payment_received && new Date(a.date) >= new Date())
        .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

      const { error } = await supabase.functions.invoke('send-manual-onboarding', {
        body: { 
          clientId: client.id,
          appointmentId: relevantApp?.id 
        }
      });
      if (error) throw error;
      showSuccess(`Onboarding email sent to ${client.email}!`);
    } catch (err: any) {
      showError(err.message || "Failed to send onboarding email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleManualKitSync = async () => {
    if (!client) return;
    setSyncingKit(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-kit', {
        body: { record: client }
      });
      if (error) throw error;
      showSuccess(`Successfully synced ${client.name} to Kit!`);
    } catch (err: any) {
      showError(err.message || "Failed to sync to Kit.");
    } finally {
      setSyncingKit(false);
    }
  };

  const handleCopyForAI = () => {
    if (!client || appointments.length === 0) return;
    setAiCopying(true);
    const prompt = generateAICasePrompt(client, appointments);
    navigator.clipboard.writeText(prompt);
    showSuccess("Deep case data formatted and copied for AI analysis!");
    setTimeout(() => setAiCopying(false), 2000);
  };

  const executeDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      const { error = null } = await supabase.from('clients').delete().eq('id', id);
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
      <Loader2 className="animate-spin text-chart-primary" size={48} />
    </div>
  );

  if (!client) return (
    <AppLayout variant="workspace">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <User size={28} className="text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-semibold text-sm">Client not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/clients")} className="rounded-xl text-xs gap-2">
          <ArrowLeft size={14} /> Back to Clients
        </Button>
      </div>
    </AppLayout>
  );

  const rollups = getClientRollups(appointments);

  const daysUntil = (d: Date): string => {
    const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
    if (diff <= 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return `In ${diff} days`;
  };

  return (
    <AppLayout variant="workspace">
      <div className="space-y-6">
        <PageHeader 
          title={client.name}
          subtitle="Comprehensive client profile, clinical history, and progress tracking."
          icon={User}

          actions={
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-muted border-border text-foreground rounded-xl font-semibold text-[10px] uppercase tracking-wider h-10 px-4"
                onClick={() => navigate("/clients")}
              >
                <ArrowLeft size={14} className="mr-2" /> Back
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-muted border-border text-chart-primary rounded-xl font-semibold text-[10px] uppercase tracking-wider h-10 px-4"
                onClick={() => setAssessmentModal({ open: true, type: 'bolt' })}
              >
                <FlaskConical size={14} className="mr-2" /> Log BOLT
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-muted border-border text-chart-destructive rounded-xl font-semibold text-[10px] uppercase tracking-wider h-10 px-4"
                onClick={() => setAssessmentModal({ open: true, type: 'coherence' })}
              >
                <Activity size={14} className="mr-2" /> Log COH
              </Button>
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-muted rounded-xl border-border h-10 px-4 font-semibold text-[10px] uppercase tracking-wider">
                    <Edit3 size={14} className="mr-2" /> Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-xl p-0">
                  <div className="p-8">
                    <DialogHeader className="mb-6">
                      <DialogTitle className="text-2xl font-semibold">Edit Client Profile</DialogTitle>
                      <DialogDescription className="font-medium">Update the personal and clinical details for this client.</DialogDescription>
                    </DialogHeader>
                    <ClientForm 
                      initialData={client}
                      onSuccess={() => {
                        setEditOpen(false);
                        fetchClientData();
                      }} 
                    />
                  </div>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                          <MoreHorizontal size={20} />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl p-2 shadow-sm border-none bg-card">
                      <DropdownMenuItem
                        onClick={handleSendOnboardingEmail}
                        disabled={sendingEmail || !client.email}
                        className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3"
                      >
                        {sendingEmail ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="text-chart-primary" />}
                        Send Onboarding
                      </DropdownMenuItem>
                      {client.notion_link && (
                        <DropdownMenuItem
                          onClick={() => window.open(client.notion_link!, '_blank')}
                          className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3"
                        >
                          <ExternalLink size={16} className="text-chart-primary" /> Open in Notion
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleCopyOnboardingLink} className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3">
                        <LinkIcon size={16} className="text-chart-primary" /> Copy Onboarding Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopyForAI} className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3">
                        <Sparkles size={16} className="text-chart-primary" /> Copy AI Case Prompt
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuItem 
                          className="text-destructive focus:text-destructive rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3"
                          onClick={() => setShowDeleteConfirm(true)}
                      >
                          <Trash2 size={16} /> Delete Client
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />

        <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-muted p-1.5 rounded-xl mb-8 border border-border">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-chart-primary data-[state=active]:shadow-sm rounded-xl h-11 font-semibold uppercase tracking-wider text-[10px] hover:text-foreground">
              <LayoutDashboard size={14} /> Overview
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-chart-primary data-[state=active]:shadow-sm rounded-xl h-11 font-semibold uppercase tracking-wider text-[10px] hover:text-foreground">
              <History size={14} /> Appointments
            </TabsTrigger>
            <TabsTrigger value="grid" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-chart-primary data-[state=active]:shadow-sm rounded-xl h-11 font-semibold uppercase tracking-wider text-[10px] hover:text-foreground">
              <LayoutGrid size={14} /> Grid
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-chart-primary data-[state=active]:shadow-sm rounded-xl h-11 font-semibold uppercase tracking-wider text-[10px] hover:text-foreground">
              <TrendingUp size={14} /> Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Identity & Contact */}
              <div className="lg:col-span-4 space-y-6">
                <ClientProfileCard client={client} />

                <Card className="border-none shadow-sm bg-card rounded-xl overflow-hidden">
                  <CardHeader className="pb-3 bg-muted/50 border-b border-border">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Zap size={16} className="text-chart-primary" /> Integrations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-chart-primary">
                          <Mail size={16} />
                        </div>
                        <span className="text-xs font-medium text-foreground">Kit</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleManualKitSync}
                        disabled={syncingKit}
                        className="h-8 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-chart-primary"
                        title="Sync client to Kit"
                      >
                        {syncingKit ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} className="mr-1.5" />}
                        Sync
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-chart-primary">
                          <CreditCard size={16} />
                        </div>
                        <span className="text-xs font-medium text-foreground">Stripe</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-semibold uppercase tracking-wider", (client as any).stripe_customer_id ? "text-chart-emerald" : "text-muted-foreground/70")}>
                          {(client as any).stripe_customer_id ? "Linked" : "Not linked"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSyncToStripe}
                          disabled={syncingStripe}
                          className="h-8 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-chart-primary"
                          title="Sync client to Stripe"
                        >
                          {syncingStripe ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} className="mr-1.5" />}
                          Sync
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-chart-primary">
                          <ExternalLink size={16} />
                        </div>
                        <span className="text-xs font-medium text-foreground">Notion</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-semibold uppercase tracking-wider", client.notion_link ? "text-chart-emerald" : "text-muted-foreground/70")}>
                          {client.notion_link ? "Linked" : "Not linked"}
                        </span>
                        {client.notion_link && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(client.notion_link!, '_blank')}
                            className="h-8 w-8 text-chart-primary rounded-lg"
                            title="Open in Notion"
                          >
                            <ExternalLink size={14} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSyncToNotion}
                          disabled={syncingNotion}
                          className="h-8 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-chart-primary"
                          title="Sync client to Notion"
                        >
                          {syncingNotion ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} className="mr-1.5" />}
                          Sync
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-chart-emerald">
                          <ShieldCheck size={16} />
                        </div>
                        <span className="text-xs font-medium text-foreground">Onboarding</span>
                      </div>
                      <Badge className="bg-chart-emerald/10 text-chart-emerald border-none font-semibold text-[10px] uppercase tracking-wider">
                        Complete
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium text-foreground">Contact & Background</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {client.occupation && (
                      <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <Briefcase size={16} />
                        </div>
                        <span className="text-foreground font-medium">{client.occupation}</span>
                      </div>
                    )}
                    {client.marital_status && (
                      <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <Heart size={16} />
                        </div>
                        <span className="text-foreground font-medium">{client.marital_status}</span>
                      </div>
                    )}
                    {client.children && (
                      <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <Baby size={16} />
                        </div>
                        <span className="text-foreground font-medium">Children: {client.children}</span>
                      </div>
                    )}
                    <hr className="border-border" />
                    <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <Mail size={16} />
                      </div>
                      <span className="text-foreground font-medium">{client.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <Phone size={16} />
                      </div>
                      <span className="text-foreground font-medium">{client.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <MapPin size={16} />
                      </div>
                      <div className="flex gap-1 flex-wrap text-foreground font-medium">
                        {client.suburbs.length > 0 ? client.suburbs.map(s => <span key={s} className="mr-1">{s}</span>) : 'No suburb'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Clinical Profile & History */}
              <div className="lg:col-span-8 space-y-8">
                {nextAppointment && (
                  <Card className="border-none shadow-sm rounded-xl bg-card border-t-4 border-chart-primary overflow-hidden">
                    <div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
                        <CalendarClock size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next Session</h3>
                          <Badge className="bg-chart-emerald/10 text-chart-emerald border-none font-semibold text-[10px] uppercase tracking-wider">
                            {daysUntil(nextAppointment.date)}
                          </Badge>
                        </div>
                        <p className="text-lg font-semibold text-foreground mt-0.5">
                          {format(nextAppointment.date, "EEEE, MMM d · h:mm a")}
                        </p>
                        <p className="text-xs text-muted-foreground/70 font-medium">
                          {nextAppointment.name || `Session ${nextAppointment.display_id || nextAppointment.id.slice(0, 8)}`}
                        </p>
                      </div>
                      <Button asChild size="sm" className="rounded-xl h-10 px-4 font-semibold text-[10px] uppercase tracking-wider shrink-0">
                        <Link to={`/appointments/${nextAppointment.id}`}>
                          Open Session <ArrowRight size={14} className="ml-1.5" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="border-none shadow-sm rounded-xl bg-card border-t-4 border-chart-primary">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                        <Activity size={16} className="text-chart-primary" /> Total Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-extrabold text-foreground">{rollups.totalSessions}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Last: {rollups.lastAppointment}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-none shadow-sm rounded-xl bg-card border-t-4 border-chart-emerald">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                        <FlaskConical size={16} className="text-chart-emerald" /> Latest BOLT
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={cn(
                        "text-3xl font-extrabold",
                        appointments.find(a => a.bolt_score)?.bolt_score ? (appointments.find(a => a.bolt_score)!.bolt_score! >= 25 ? "text-chart-emerald" : "text-chart-destructive") : "text-muted-foreground/60"
                      )}>
                        {appointments.find(a => a.bolt_score)?.bolt_score ? `${appointments.find(a => a.bolt_score)!.bolt_score}s` : "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Target: 40s</p>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-xl bg-card border-t-4 border-chart-destructive">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                        <Brain size={16} className="text-chart-destructive" /> Latest Coherence
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-extrabold text-chart-destructive">
                        {appointments.find(a => a.coherence_score)?.coherence_score?.toFixed(2) || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Autonomic sync ratio</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Comprehensive Clinical Profile Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                      <ShieldAlert size={20} />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground tracking-tight">Clinical Profile</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-none shadow-sm bg-card rounded-xl overflow-hidden">
                      <CardHeader className="bg-muted/50 border-b border-border">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-chart-destructive flex items-center gap-2">
                          <Activity size={14} /> Medical History & Injuries
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                          {client.medical_history || "No medical history recorded."}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-card rounded-xl overflow-hidden">
                      <CardHeader className="bg-muted/50 border-b border-border">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <Zap size={14} /> Medications & Supplements
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                          {client.medications_supplements || "No medications recorded."}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-card rounded-xl overflow-hidden">
                      <CardHeader className="bg-muted/50 border-b border-border">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-chart-primary flex items-center gap-2">
                          <ShieldAlert size={14} /> Emergency Contact
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-3">
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase">Contact Name</p>
                          <p className="text-sm font-medium text-foreground">{client.emergency_contact_name || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase">Contact Phone</p>
                          <p className="text-sm font-medium text-foreground">{client.emergency_contact_phone || "Not provided"}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-card rounded-xl overflow-hidden">
                      <CardHeader className="bg-muted/50 border-b border-border">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-chart-emerald flex items-center gap-2">
                          <TrendingUp size={14} /> Baseline Health Vitals
                        </CardTitle>
                      </CardHeader>                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase">Stress Level</p>
                            <p className="text-lg font-semibold text-chart-primary">{client.current_stress_level || "—"} / 10</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase">Sleep Quality</p>
                            <p className="text-sm font-medium text-foreground">{client.sleep_quality || "Not set"}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase">Digestive Health</p>
                            <p className="text-sm font-medium text-foreground">{client.digestive_health || "Not set"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-muted border-border shadow-none rounded-xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <Info size={14} /> Referral Source
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm font-medium text-foreground">{client.referral_source || "Not recorded"}</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/50 border-border shadow-none rounded-xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <History size={14} /> Practitioner Journal
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed font-medium">
                          {parseClientJournal(client.journal).notes || "No personal reflections recorded."}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="border-t border-border pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Phone size={14} className="text-muted-foreground" />
                      Contact Log
                    </h3>
                    <Dialog open={contactLogOpen} onOpenChange={setContactLogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs font-medium border-border">
                          <Plus size={14} className="mr-1" /> Log Contact
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-xl sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-base font-semibold">Log Contact with {client?.name}</DialogTitle>
                          <DialogDescription className="text-sm text-muted-foreground">
                            Record a phone call, message, or other outreach.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <textarea
                            value={contactLogNote}
                            onChange={(e) => setContactLogNote(e.target.value)}
                            placeholder="What was discussed? (e.g., Checked in re vasovagal syncope diagnosis)"
                            className="w-full min-h-[100px] rounded-xl border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setContactLogOpen(false)} className="rounded-lg text-xs border-border">
                              Cancel
                            </Button>
                            <Button size="sm" onClick={handleLogContact} disabled={savingContact || !contactLogNote.trim()} className="rounded-lg text-xs">
                              {savingContact ? <Loader2 size={14} className="animate-spin mr-1" /> : <Send size={14} className="mr-1" />}
                              Log Contact
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {(!(client as any).contact_log || (client as any).contact_log.length === 0) ? (
                    <div className="text-sm text-muted-foreground/70 py-6 text-center border border-dashed border-border rounded-xl">
                      No contact events logged yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(client as any).contact_log.slice().reverse().map((entry: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                            <Phone size={14} className="text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{entry.note}</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                              {format(new Date(entry.timestamp), "MMM d, yyyy h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-6">
                  <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                  <Button variant="ghost" size="sm" className="text-muted-foreground font-medium text-xs" onClick={() => setSearchParams({ tab: "appointments" })}>
                    View All <ArrowRight size={14} className="ml-1" />
                  </Button>
                </div>

                <div className="grid gap-4">
                  {appointments.slice(0, 3).map(app => (
                    <ClientAppointmentCard
                      key={app.id}
                      app={app}
                      grid={gridFor[app.id]}
                      generatingLink={generatingLink}
                      onGeneratePaymentLink={handleGeneratePaymentLink}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold text-foreground">Session History</h3>
              <Dialog open={appOpen} onOpenChange={setAppOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-sm rounded-xl h-10 px-4">
                    <Plus size={16} className="mr-2" /> Book Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Schedule New Appointment</DialogTitle>
                    <DialogDescription>Book a new session for this client.</DialogDescription>
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
                <ClientAppointmentCard
                  key={app.id}
                  app={app}
                  grid={gridFor[app.id]}
                  showTag
                  generatingLink={generatingLink}
                  onGeneratePaymentLink={handleGeneratePaymentLink}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="grid" className="space-y-6">
            <ClientGridSummaryTab
              clientName={client?.name || "Client"}
              appointments={appointments}
              gridFor={gridFor}
            />
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

      {assessmentModal && client && (
        <QuickAssessmentModal 
          open={assessmentModal.open}
          onOpenChange={(open) => !open && setAssessmentModal(null)}
          clientId={client.id}
          clientName={client.name}
          type={assessmentModal.type}
          onComplete={fetchClientData}
        />
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Client"
        description="Are you sure you want to delete this client? This will remove all their appointments too."
        onConfirm={executeDelete}
      />
    </AppLayout>
  );
};

export default ClientDetailPage;