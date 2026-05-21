"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Settings,
  User,
  LogOut,
  Mail,
  Loader2,
  RefreshCw,
  Zap,
  Info,
  Calendar,
  Copy,
  Check,
  ShieldCheck,
  Link as LinkIcon,
  Sparkles,
  Globe,
  CreditCard,
  DollarSign,
  Users,
  FileText,
  ArrowRight,
  LayoutGrid,
  Layers,
  Merge,
  ArrowRightLeft,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);
  const [initializingStripe, setInitializingStripe] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingNotionAll, setSyncingNotionAll] = useState(false);
  const [syncingAppointmentsAll, setSyncingAppointmentsAll] = useState(false);
  
  // Merge Clients State
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [sourceClientId, setSourceClientId] = useState<string>("");
  const [targetClientId, setTargetClientId] = useState<string>("");
  const [merging, setMerging] = useState(false);

  const projectRef = "xebtjnvfkroiplyzftas";
  const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/calcom-webhook`;

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .or('is_practitioner.eq.false,is_practitioner.is.null')
        .order('name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);
  
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    showSuccess("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleInitializeStripe = async () => {
    setInitializingStripe(true);
    try {
      const { error } = await supabase.functions.invoke('stripe-manager', {
        body: { action: 'setup-product' }
      });
      if (error) throw error;
      showSuccess("Stripe Product initialized!");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setInitializingStripe(false);
    }
  };

  const handleSyncAllToStripe = async () => {
    setSyncingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-manager', {
        body: { action: 'sync-all' }
      });
      if (error) throw error;
      showSuccess(`Successfully synced ${data.syncedCount} clients to Stripe!`);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSyncAllToNotion = async () => {
    setSyncingNotionAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-notion', {
        body: { 
          action: 'sync-all-clients',
          origin: window.location.origin
        }
      });
      if (error) throw error;
      showSuccess(`Successfully synced ${data.syncedCount} clients to Notion!`);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSyncingNotionAll(false);
    }
  };

  const handleSyncAllAppointmentsToNotion = async () => {
    setSyncingAppointmentsAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-notion', {
        body: { 
          action: 'sync-all-appointments',
          origin: window.location.origin
        }
      });
      if (error) throw error;
      showSuccess(`Successfully synced ${data.syncedCount} appointments to Notion!`);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSyncingAppointmentsAll(false);
    }
  };

  const handleMergeClients = async () => {
    if (!sourceClientId || !targetClientId) {
      showError("Please select both a source and target client.");
      return;
    }

    if (sourceClientId === targetClientId) {
      showError("Source and target clients cannot be the same.");
      return;
    }

    const sourceName = clients.find(c => c.id === sourceClientId)?.name;
    const targetName = clients.find(c => c.id === targetClientId)?.name;

    if (!confirm(`Are you sure you want to merge "${sourceName}" into "${targetName}"?\n\nThis will:\n1. Move all appointments to "${targetName}"\n2. Archive "${sourceName}" in Notion\n3. Delete "${sourceName}" from the CRM\n\nThis action cannot be undone.`)) {
      return;
    }

    setMerging(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-notion', {
        body: {
          action: 'merge-clients',
          sourceClientId,
          targetClientId,
          origin: window.location.origin
        }
      });

      if (error) throw error;

      showSuccess(`Successfully merged "${sourceName}" into "${targetName}"!`);
      setSourceClientId("");
      setTargetClientId("");
      fetchClients();
    } catch (err: any) {
      showError(err.message || "Failed to merge clients.");
    } finally {
      setMerging(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      showSuccess("Signed out successfully");
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const IntegrationStatus = ({ name, icon: Icon, description, status = "Connected" }: any) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-indigo-600">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-black text-slate-900 dark:text-white">{name}</p>
          <p className="text-[10px] text-slate-500 font-medium">{description}</p>
        </div>
      </div>
      <Badge className={cn(
        "border-none font-black text-[8px] uppercase tracking-widest",
        status === "Connected" ? "bg-emerald-50 text-white" : "bg-amber-500 text-white"
      )}>
        {status}
      </Badge>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">System Settings</h1>
            <p className="text-slate-500 font-medium">Manage your clinical infrastructure and automations.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <Globe size={24} className="text-indigo-500" /> Integration Ecosystem
              </CardTitle>
              <CardDescription className="font-medium">Status of your linked clinical and marketing tools.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IntegrationStatus name="Kit (ConvertKit)" icon={Mail} description="Marketing & Newsletter Sync" />
                <IntegrationStatus name="Notion" icon={LinkIcon} description="Clinical Database & Planner" />
                <IntegrationStatus name="Gmail API" icon={Sparkles} description="Automated Onboarding Emails" />
                <IntegrationStatus name="Cal.com" icon={Calendar} description="Booking & Scheduling" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden border-2 border-purple-100">
            <CardHeader className="p-8 pb-4 bg-purple-50/50">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-purple-900">
                <Layers size={24} /> Notion Database Sync
              </CardTitle>
              <CardDescription className="text-purple-700 font-medium">Bulk sync your clients and appointments to Notion.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-900/30 space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">Bulk Sync Clients</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Push all existing CRM clients into your Notion Client Database.</p>
                  </div>
                  <Button 
                    onClick={handleSyncAllToNotion} 
                    disabled={syncingNotionAll}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10 font-black text-[10px] uppercase tracking-widest shadow-lg"
                  >
                    {syncingNotionAll ? <Loader2 className="mr-2 animate-spin" /> : <Users size={16} className="mr-2" />}
                    Sync All to Notion
                  </Button>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-900/30 space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">Bulk Sync Appointments</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Push all existing appointments to Notion and link them to clients.</p>
                  </div>
                  <Button 
                    onClick={handleSyncAllAppointmentsToNotion} 
                    disabled={syncingAppointmentsAll}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 font-black text-[10px] uppercase tracking-widest shadow-lg"
                  >
                    {syncingAppointmentsAll ? <Loader2 className="mr-2 animate-spin" /> : <Calendar size={16} className="mr-2" />}
                    Sync All Appointments
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Merge Clients Card */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden border-2 border-amber-100">
            <CardHeader className="p-8 pb-4 bg-amber-50/50">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-amber-900">
                <Merge size={24} /> Merge Duplicate Clients
              </CardTitle>
              <CardDescription className="text-amber-700 font-medium">Consolidate duplicate client profiles in both the CRM and Notion.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">1. Duplicate Client (To Remove)</label>
                  <Select value={sourceClientId} onValueChange={setSourceClientId} disabled={loadingClients || merging}>
                    <SelectTrigger className="h-12 rounded-xl font-bold bg-slate-50 border-slate-200">
                      <SelectValue placeholder={loadingClients ? "Loading..." : "Select duplicate..."} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[250px]">
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">2. Primary Client (To Keep)</label>
                  <Select value={targetClientId} onValueChange={setTargetClientId} disabled={loadingClients || merging}>
                    <SelectTrigger className="h-12 rounded-xl font-bold bg-slate-50 border-slate-200">
                      <SelectValue placeholder={loadingClients ? "Loading..." : "Select primary..."} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[250px]">
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sourceClientId && targetClientId && (
                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                  <ArrowRightLeft size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-900">Merge Action Summary:</p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      All appointments for <strong>{clients.find(c => c.id === sourceClientId)?.name}</strong> will be moved to <strong>{clients.find(c => c.id === targetClientId)?.name}</strong>. The duplicate page in Notion will be archived, and the duplicate profile in the CRM will be deleted.
                    </p>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleMergeClients}
                disabled={merging || !sourceClientId || !targetClientId}
                className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-100"
              >
                {merging ? <Loader2 className="animate-spin mr-2" /> : <Merge size={18} className="mr-2" />}
                Merge Client Profiles
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden border-2 border-indigo-100">
            <CardHeader className="p-8 pb-4 bg-indigo-50/50">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-900">
                <CreditCard size={24} /> Stripe Clinical Payments
              </CardTitle>
              <CardDescription className="text-indigo-700 font-medium">Link your CRM clients to Stripe for seamless Tap-to-Pay and invoicing.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">1. Initialize FNH Product</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Creates the '$50 FNH Clinical Assessment' product in Stripe.</p>
                  </div>
                  <Button 
                    onClick={handleInitializeStripe} 
                    disabled={initializingStripe}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 font-black text-[10px] uppercase tracking-widest shadow-lg"
                  >
                    {initializingStripe ? <Loader2 className="animate-spin" /> : <Zap size={16} className="mr-2" />}
                    Initialize
                  </Button>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">2. Bulk Sync Clients</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Push all existing CRM clients into your Stripe customer list.</p>
                  </div>
                  <Button 
                    onClick={handleSyncAllToStripe} 
                    disabled={syncingAll}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-black text-[10px] uppercase tracking-widest shadow-lg"
                  >
                    {syncingAll ? <Loader2 className="mr-2 animate-spin" /> : <Users size={16} className="mr-2" />}
                    Sync All to Stripe
                  </Button>
                </div>
              </div>

              <div className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-3xl border border-amber-100 dark:border-amber-900/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-amber-600" />
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Automation Active</p>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                  New bookings from Cal.com will now automatically create Stripe customers. Use the button above to sync your current database.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
                <FileText size={24} className="text-indigo-500" /> Documentation & Audit
              </CardTitle>
              <CardDescription className="font-medium">Export site structure and content breakdowns.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <Link to="/settings/audit">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                      <LayoutGrid size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">Site Audit Tool</p>
                      <p className="text-[10px] text-slate-500 font-medium">Full text breakdown of all pages</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <Calendar size={24} className="text-amber-500" /> Cal.com Webhook Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Unique Endpoint</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-400 truncate flex items-center">
                    {webhookUrl}
                  </div>
                  <Button variant="outline" size="icon" className="rounded-xl h-12 w-12 shrink-0" onClick={() => handleCopy(webhookUrl, 'web')}>
                    {copied === 'web' ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <User size={24} className="text-rose-500" /> Account
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-lg">
                  P
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white">Practitioner Account</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Session</p>
                </div>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-100 dark:shadow-none"
              >
                <LogOut size={18} className="mr-2" /> Sign Out of System
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;