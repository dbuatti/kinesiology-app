import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, FlaskConical, Activity, RefreshCw, Sparkles, UserPlus, Trash2, AlertTriangle, Mail, Send, DollarSign, CheckCircle2, ShieldCheck, Zap, Heart } from "lucide-react";
import { subDays } from "date-fns";

const DebugAppointmentPage = () => {
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState<'paid' | 'free' | null>(null);
  const [testAppointmentId, setTestAppointmentId] = useState<string>("");
  const [boltScore, setBoltScore] = useState<string>("30");
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  const testEmail = "daniele.buatti@gmail.com";

  const seedSusansWin = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('client_wins')
        .insert({
          user_id: user.id,
          client_name: "Susan Lord",
          content: "Slept like a baby — 9 hours and no wake ups or bad dreams — feeling good 🤗",
          context: "Post-session feedback"
        });

      if (error) throw error;
      showSuccess("Susan's win has been added to your vault!");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const simulateWebhook = async () => {
    if (!testAppointmentId) {
      showError("Create a test appointment first (Step 1 below)");
      return;
    }

    setSimulating(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ payment_received: true, payment_method: 'Stripe (Simulated)' })
        .eq('id', testAppointmentId)
        .select()
        .single();

      if (error) throw error;

      setDebugInfo({ step: "webhook_simulated", appointment: data });
      showSuccess("Webhook simulation successful! Appointment marked as paid.");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSimulating(false);
    }
  };

  const sendTestEmail = async (type: 'paid' | 'free') => {
    setEmailLoading(type);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .upsert({
          user_id: user.id,
          name: "Test Daniele",
          email: testEmail,
          pronouns: "Tester"
        }, { onConflict: 'email' })
        .select()
        .single();

      if (clientError) throw clientError;

      const { error: appError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          client_id: client.id,
          date: new Date().toISOString(),
          tag: "Test Session",
          status: "Scheduled",
          is_paid: type === 'paid',
          payment_received: false 
        });

      if (appError) throw appError;

      const { error: funcError } = await supabase.functions.invoke('send-manual-onboarding', {
        body: { clientId: client.id }
      });

      if (funcError) throw funcError;

      showSuccess(`Test ${type} email sent to ${testEmail}!`);
    } catch (err: any) {
      console.error(err);
      showError(err.message || "Failed to send test email");
    } finally {
      setEmailLoading(null);
    }
  };

  const seedDemoData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: "Arthur Dent",
          born: "1982-05-25",
          email: "arthur@hitchhikers.guide",
          pronouns: "He/Him",
          journal: "History of whiplash and chronic stress. Reports feeling 'unplugged' from his body."
        })
        .select()
        .single();

      if (clientError) throw clientError;

      const sessions = [
        {
          user_id: user.id,
          client_id: client.id,
          date: subDays(new Date(), 14).toISOString(),
          name: "Initial Assessment",
          tag: "Kinesiology",
          status: "Completed",
          bolt_score: 12,
          priority_pattern: JSON.stringify({
            primitiveReflexes: { "Fear Paralysis": "Inhibited", "Moro Reflex": "Inhibited" },
            cranialNerves: { "CN X: Vagus": "Inhibited" }
          })
        },
        {
          user_id: user.id,
          client_id: client.id,
          date: subDays(new Date(), 7).toISOString(),
          name: "Follow-up Session",
          tag: "Kinesiology",
          status: "Completed",
          bolt_score: 18,
          priority_pattern: JSON.stringify({
            primitiveReflexes: { "Fear Paralysis": "Clear", "Moro Reflex": "Inhibited" },
            cranialNerves: { "CN X: Vagus": "Inhibited", "CN V: Trigeminal": "Inhibited" }
          })
        },
        {
          user_id: user.id,
          client_id: client.id,
          date: new Date().toISOString(),
          name: "Current Session",
          tag: "Kinesiology",
          status: "Scheduled",
          bolt_score: 22,
          priority_pattern: JSON.stringify({
            primitiveReflexes: { "Fear Paralysis": "Clear", "Moro Reflex": "Clear" },
            cranialNerves: { "CN X: Vagus": "Inhibited", "CN V: Trigeminal": "Clear" }
          })
        }
      ];

      const { error: appError } = await supabase.from('appointments').insert(sessions);
      if (appError) throw appError;

      showSuccess("Arthur Dent and 3 sessions created!");
    } catch (err: any) {
      showError(err.message || "Failed to seed data");
    } finally {
      setLoading(false);
    }
  };

  const createTestAppointment = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: clients } = await supabase.from('clients').select('id').limit(1);
      if (!clients || clients.length === 0) throw new Error("No clients found.");

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          user_id: user!.id,
          client_id: clients[0].id,
          date: new Date().toISOString(),
          name: "DEBUG TEST APPOINTMENT",
          tag: "Kinesiology",
          status: "Scheduled",
          is_paid: true,
          payment_received: false
        })
        .select()
        .single();

      if (error) throw error;
      setTestAppointmentId(appointment.id);
      showSuccess("Test appointment created!");
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const testBoltScore = async () => {
    if (!testAppointmentId) return;
    setLoading(true);
    try {
      await supabase.from('appointments').update({ bolt_score: parseInt(boltScore) }).eq('id', testAppointmentId);
      showSuccess("BOLT score updated!");
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">🔧 Debug & Admin</h1>
          <p className="text-slate-500 mt-2">System maintenance and testing tools.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Susan's Win Seeder */}
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-rose-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Heart size={120} /></div>
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <Heart size={28} className="text-rose-400 fill-rose-400" /> Seed Susan's Win
            </CardTitle>
            <CardDescription className="text-rose-200 font-medium">
              Instantly add Susan Lord's sleep breakthrough to your Wins Vault.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 italic text-sm text-rose-100">
              "Slept like a baby — 9 hours and no wake ups or bad dreams — feeling good 🤗"
            </div>
            <Button 
              onClick={seedSusansWin}
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-widest shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles size={18} className="mr-2" />}
              Add to Wins Vault
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-emerald-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck size={120} /></div>
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <RefreshCw size={28} className="text-emerald-400" /> Stripe Webhook Simulator
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <Button 
              onClick={simulateWebhook}
              disabled={simulating || !testAppointmentId}
              className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-lg"
            >
              {simulating ? <Loader2 className="animate-spin mr-2" /> : <Zap size={18} className="mr-2" />}
              Simulate Payment
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="text-indigo-900 flex items-center gap-2">
              <Sparkles size={20} className="text-indigo-600" /> Seed Demo Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={seedDemoData} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus size={18} className="mr-2" />}
              Seed Arthur Dent & History
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200">
          <CardHeader><CardTitle className="text-lg">Test Appointment Flow</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={createTestAppointment} disabled={loading || !!testAppointmentId} className="w-full bg-slate-900">
              Create Test Appointment
            </Button>
            {testAppointmentId && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400">Active ID</p>
                  <p className="text-xs font-mono">{testAppointmentId}</p>
                </div>
                <div className="flex gap-2">
                  <Input type="number" value={boltScore} onChange={e => setBoltScore(e.target.value)} className="w-24" />
                  <Button onClick={testBoltScore} className="flex-1 bg-indigo-600">Update BOLT</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebugAppointmentPage;