"use client";

import { useState } from "react";
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
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import AppLayout from "@/components/crm/AppLayout";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);
  const [initializingStripe, setInitializingStripe] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);

  const projectRef = "xebtjnvfkroiplyzftas";
  const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/calcom-webhook`;
  
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
        status === "Connected" ? "bg-emerald-50 text-white" : "bg-amber-50 text-white"
      )}>
        {status}
      </Badge>
    </div>
  );

  return (
    <AppLayout variant="workspace">
      <div className="space-y-10 animate-in fade-in duration-700">
        <PageHeader 
          title="System Settings"
          subtitle="Manage your clinical infrastructure and automations."
          icon={Settings}
          breadcrumbs={[{ label: "System" }, { label: "Settings" }]}
        />

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
    </AppLayout>
  );
};

export default SettingsPage;