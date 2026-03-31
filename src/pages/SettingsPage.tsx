import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, User, LogOut, Upload, Database, Download, Mail, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate, Link } from "react-router-dom";
import { exportClientsToMailchimpCSV } from "@/utils/data-exporter";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      showSuccess("Signed out successfully");
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleExport = async () => {
    setExporting(true);
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

      exportClientsToMailchimpCSV(data);
      showSuccess(`Exported ${data.length} contacts for Mailchimp.`);
    } catch (err: any) {
      showError(err.message || "Failed to export contacts.");
    } finally {
      setExporting(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const { data: clients, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .or('is_practitioner.eq.false,is_practitioner.is.null');

      if (fetchError) throw fetchError;

      let successCount = 0;
      for (const client of (clients || [])) {
        if (!client.email) continue;
        
        const { error: syncError } = await supabase.functions.invoke('sync-to-mailchimp', {
          body: { record: client }
        });
        
        if (!syncError) successCount++;
      }

      showSuccess(`Successfully synced ${successCount} contacts to Mailchimp.`);
    } catch (err: any) {
      showError("Manual sync failed. Ensure the Edge Function is deployed and secrets are set.");
    } finally {
      setSyncing(false);
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

              <Button 
                onClick={handleExport}
                disabled={exporting}
                variant="outline"
                className="w-full h-11 rounded-xl border-slate-200 font-bold justify-start"
              >
                {exporting ? <Loader2 className="mr-3 animate-spin" /> : <Download size={18} className="mr-3 text-indigo-500" />}
                Export CSV for Mailchimp
              </Button>

              <Button 
                onClick={handleManualSync}
                disabled={syncing}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100"
              >
                {syncing ? <Loader2 className="mr-3 animate-spin" /> : <RefreshCw size={18} className="mr-3" />}
                Sync Existing to Mailchimp
              </Button>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-1">
                <Mail size={14} className="text-indigo-600" />
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Automation Tip</p>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                To automate this, set up a <strong>Database Webhook</strong> in your Supabase Dashboard to trigger the <code>sync-to-mailchimp</code> function on every new client.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;