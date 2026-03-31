import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, User, LogOut, Upload, Database, Download, Mail, Loader2, RefreshCw, ExternalLink, Zap, Info, Calendar, Copy, Check, ShieldAlert, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate, Link } from "react-router-dom";
import { exportClientsToMailchimpCSV, exportClientsToKitCSV } from "@/utils/data-exporter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState<'mailchimp' | 'kit' | null>(null);
  const [syncing, setSyncing] = useState<'mailchimp' | 'kit' | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const projectRef = "xebtjnvfkroiplyzftas";
  const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/calcom-webhook`;
  
  const onboardingBaseUrl = `${window.location.origin}/onboarding/welcome?email=`;
  const calcomLink = `${onboardingBaseUrl}{email}`;
  const kitLink = `${onboardingBaseUrl}{{{ email }}}`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    showSuccess("Link copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExport = async (provider: 'mailchimp' | 'kit') => {
    setExporting(provider);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .or('is_practitioner.eq.false,is_practitioner.is.null');

      if (error) throw error;

      if (provider === 'mailchimp') {
        exportClientsToMailchimpCSV(data || []);
      } else {
        exportClientsToKitCSV(data || []);
      }
      showSuccess(`Exported ${data?.length || 0} clients for ${provider}`);
    } catch (err: any) {
      showError(err.message || "Export failed");
    } finally {
      setExporting(null);
    }
  };

  const handleManualSync = async (provider: 'mailchimp' | 'kit') => {
    setSyncing(provider);
    try {
      const { data: clients, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .or('is_practitioner.eq.false,is_practitioner.is.null');

      if (fetchError) throw fetchError;

      const functionName = provider === 'mailchimp' ? 'sync-to-mailchimp' : 'sync-to-kit';
      
      let successCount = 0;
      for (const client of (clients || [])) {
        const { error: syncError } = await supabase.functions.invoke(functionName, {
          body: { record: client }
        });
        if (!syncError) successCount++;
      }

      showSuccess(`Successfully synced ${successCount} clients to ${provider}`);
    } catch (err: any) {
      showError(err.message || "Sync failed");
    } finally {
      setSyncing(null);
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

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="text-slate-500">Manage your account and application preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg rounded-2xl bg-indigo-900 text-white md:col-span-2 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><LinkIcon size={120} /></div>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <LinkIcon size={20} className="text-indigo-400" /> Onboarding Automation
            </CardTitle>
            <CardDescription className="text-indigo-200">Use these links in your booking tools to gather client details automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">For Cal.com Instructions</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-300 hover:text-white" onClick={() => handleCopy(calcomLink, 'cal')}>
                    {copied === 'cal' ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
                <p className="text-xs font-mono bg-black/20 p-3 rounded-lg break-all">{calcomLink}</p>
                <p className="text-[10px] text-indigo-200 italic">Paste this into "Confirmation Page Instructions" in Cal.com.</p>
              </div>

              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">For Kit (ConvertKit) Emails</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-300 hover:text-white" onClick={() => handleCopy(kitLink, 'kit')}>
                    {copied === 'kit' ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
                <p className="text-xs font-mono bg-black/20 p-3 rounded-lg break-all">{kitLink}</p>
                <p className="text-[10px] text-indigo-200 italic">Use this in your "Welcome" automation in Kit.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-2xl bg-white border-t-4 border-amber-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar size={20} className="text-amber-500" /> Cal.com Webhook
              </CardTitle>
              <Badge className="bg-amber-100 text-amber-700 border-none">Automation</Badge>
            </div>
            <CardDescription>Sync bookings to your CRM automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-700">Your Webhook URL:</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono text-slate-600 truncate flex items-center">
                  {webhookUrl}
                </div>
                <Button variant="outline" size="icon" className="rounded-xl shrink-0" onClick={() => handleCopy(webhookUrl, 'web')}>
                  {copied === 'web' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-3">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-amber-600" />
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Setup Instructions</p>
              </div>
              <ol className="text-xs text-amber-800 space-y-2 list-decimal pl-4 font-medium">
                <li>Go to <strong>Cal.com Settings {" > "} Webhooks</strong>.</li>
                <li>Paste the URL above into <strong>Subscriber URL</strong>.</li>
                <li>Select <strong>Booking Created</strong> and <strong>Booking Cancelled</strong>.</li>
                <li>Click <strong>Save</strong>.</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-2xl bg-white border-t-4 border-indigo-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Zap size={20} className="text-indigo-600" /> Kit Integration
              </CardTitle>
              <Badge className="bg-indigo-100 text-indigo-700 border-none">Active</Badge>
            </div>
            <CardDescription>Sync your clients to Kit (formerly ConvertKit).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button 
                onClick={() => handleExport('kit')}
                disabled={!!exporting}
                variant="outline"
                className="w-full h-11 rounded-xl border-slate-200 font-bold justify-start"
              >
                {exporting === 'kit' ? <Loader2 className="mr-3 animate-spin" /> : <Download size={18} className="mr-3 text-indigo-600" />}
                Export CSV for Kit
              </Button>

              <Button 
                onClick={() => handleManualSync('kit')}
                disabled={!!syncing}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100"
              >
                {syncing === 'kit' ? <Loader2 className="mr-3 animate-spin" /> : <RefreshCw size={18} className="mr-3" />}
                Sync Existing to Kit
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-2xl bg-white border-t-4 border-rose-600">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <User size={20} className="text-rose-600" /> Account
            </CardTitle>
            <CardDescription>Manage your session and security.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              className="w-full h-11 rounded-xl font-bold"
            >
              <LogOut size={18} className="mr-2" /> Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;