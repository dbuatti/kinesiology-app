import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, User, LogOut, Upload, Database, Download, Mail, Loader2, RefreshCw, ExternalLink, Zap, Info, Calendar, Copy, Check, ShieldAlert, Link as LinkIcon, FileText, ListChecks, Sparkles, Brain, CheckCircle2 } from "lucide-react";
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
  
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    showSuccess("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
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
        {/* Gmail API Automation Helper */}
        <Card className="border-none shadow-lg rounded-2xl bg-slate-900 text-white md:col-span-2 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Mail size={120} /></div>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Mail size={20} className="text-indigo-400" /> Gmail Onboarding Automation
            </CardTitle>
            <CardDescription className="text-slate-400">Send professional onboarding emails directly from your Gmail account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 relative z-10">
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-6">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                <h4 className="text-sm font-bold">Gmail API Setup Guide</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-indigo-300 uppercase">1. Google Cloud Console</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Create a project in Google Cloud Console. Enable the <strong>Gmail API</strong>. Create OAuth 2.0 credentials (Web Application).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-indigo-300 uppercase">2. Get Refresh Token</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Use the OAuth Playground to authorize the <code className="bg-black/20 px-1">https://www.googleapis.com/auth/gmail.send</code> scope and generate a Refresh Token.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-bold text-indigo-300 uppercase">3. Set Supabase Secrets</p>
                  <div className="grid grid-cols-1 gap-2">
                    {["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN", "GMAIL_USER_EMAIL"].map(secret => (
                      <div key={secret} className="flex items-center justify-between p-2 bg-black/20 rounded-lg border border-white/5">
                        <code className="text-[10px] text-emerald-400">{secret}</code>
                        <CheckCircle2 size={12} className="text-slate-600" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-[10px] text-slate-400 italic">
                  Once configured, every new Cal.com booking will trigger a personalized email from your address containing the client's unique onboarding link.
                </p>
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