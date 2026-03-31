import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, User, LogOut, Upload, Database, Download, Mail, Loader2, RefreshCw, ExternalLink, Zap, Info, Calendar, Copy, Check } from "lucide-react";
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
  const [copied, setCopied] = useState(false);

  // Derived from the client config
  const projectRef = "xebtjnvfkroiplyzftas";
  const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/calcom-webhook`;

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      showSuccess("Signed out successfully");
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    showSuccess("Webhook URL copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async (provider: 'mailchimp' | 'kit') => {
    setExporting(provider);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .or('is_practitioner.eq.false,is_practitioner.is.null');

      if (error) throw error;
      if (!data || data.length === 0) {
        showError("No clients found to export.");
        return;
      }

      if (provider === 'mailchimp') exportClientsToMailchimpCSV(data);
      else exportClientsToKitCSV(data);
      
      showSuccess(`Exported ${data.length} contacts for ${provider === 'kit' ? 'Kit' : 'Mailchimp'}.`);
    } catch (err: any) {
      showError(err.message || "Failed to export contacts.");
    } finally {
      setExporting(null);
    }
  };

  const handleManualSync = async (provider: 'mailchimp' | 'kit') => {
    setSyncing(provider);
    const functionName = provider === 'kit' ? 'sync-to-kit' : 'sync-to-mailchimp';
    
    try {
      const { data: clients, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .or('is_practitioner.eq.false,is_practitioner.is.null');

      if (fetchError) throw fetchError;

      let successCount = 0;
      for (const client of (clients || [])) {
        if (!client.email) continue;
        
        const { error: syncError } = await supabase.functions.invoke(functionName, {
          body: { record: client }
        });
        
        if (!syncError) successCount++;
      }

      showSuccess(`Successfully synced ${successCount} contacts to ${provider === 'kit' ? 'Kit' : 'Mailchimp'}.`);
    } catch (err: any) {
      showError(`Manual sync failed. Ensure the ${provider} Edge Function is deployed and secrets are set.`);
    } finally {
      setSyncing(null);
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
        {/* Cal.com Integration */}
        <Card className="border-none shadow-lg rounded-2xl bg-white border-t-4 border-amber-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar size={20} className="text-amber-500" /> Cal.com Integration
              </CardTitle>
              <Badge className="bg-amber-100 text-amber-700 border-none">Automation</Badge>
            </div>
            <CardDescription>Automatically sync bookings to your CRM.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-700">Your Webhook URL:</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono text-slate-600 truncate flex items-center">
                  {webhookUrl}
                </div>
                <Button variant="outline" size="icon" className="rounded-xl shrink-0" onClick={handleCopyWebhook}>
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-3">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-amber-600" />
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Setup Instructions</p>
              </div>
              <ol className="text-xs text-amber-800 space-y-2 list-decimal pl-4 font-medium">
                <li>Go to your <strong>Cal.com Dashboard</strong>.</li>
                <li>Navigate to <strong>Settings {" > "} Webhooks</strong>.</li>
                <li>Click <strong>Add New Webhook</strong>.</li>
                <li>Paste the URL above into the <strong>Subscriber URL</strong> field.</li>
                <li>Select <strong>Booking Created</strong> as the event trigger.</li>
                <li>Click <strong>Save</strong>.</li>
              </ol>
              <a 
                href="https://app.cal.com/settings/developer/webhooks" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-amber-600 flex items-center gap-1 hover:underline pt-1"
              >
                Open Cal.com Webhooks <ExternalLink size={10} />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Kit Integration Card */}
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
            
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-indigo-600" />
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Setup Required</p>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                1. Get your <strong>API Secret</strong> from Kit Settings.<br/>
                2. Set it as <code>KIT_API_SECRET</code> in your Supabase project secrets.
              </p>
              <a 
                href="https://app.kit.com/user/edit#api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline"
              >
                Open Kit API Settings <ExternalLink size={10} />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <User size={20} className="text-indigo-500" /> Account
            </CardTitle>
            <CardDescription>Manage your profile information and authentication.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Currently, only sign-out functionality is available here. Profile management features will be added soon.
            </p>
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              className="w-full rounded-xl h-11 font-bold"
            >
              <LogOut size={18} className="mr-2" /> Sign Out
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Database size={20} className="text-emerald-500" /> Data Management
            </CardTitle>
            <CardDescription>Import and export your practice data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button 
                asChild
                variant="outline"
                className="w-full h-11 rounded-xl border-slate-200 font-bold justify-start"
              >
                <Link to="/settings/import">
                  <Upload size={18} className="mr-3 text-emerald-500" /> Import Appointment Data
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;