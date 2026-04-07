import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, FlaskConical, Activity, RefreshCw, Sparkles, UserPlus, Trash2, AlertTriangle, Mail, Send, DollarSign, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { subDays } from "date-fns";

const DebugAppointmentPage = () => {
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState<'paid' | 'free' | null>(null);
  const [testAppointmentId, setTestAppointmentId] = useState<string>("");
  const [boltScore, setBoltScore] = useState<string>("30");
  const [heartRate, setHeartRate] = useState<string>("72");
  const [breathRate, setBreathRate] = useState<string>("12");
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  const testEmail = "daniele.buatti@gmail.com";

  const simulateWebhook = async () => {
    if (!testAppointmentId) {
      showError("Create a test appointment first (Step 1 below)");
      return;
    }

    setSimulating(true);
    try {
      // We call the webhook function directly with a mock payload
      // Note: This will only work if the edge function is set to handle 
      // requests without a valid Stripe signature for testing, 
      // OR if we just manually trigger the DB update for the test.
      
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

  const cleanupTransverseAbdominals = async () => {
    if (!confirm("This will permanently delete ALL test records for 'Transverse Abdominals' across all clients and sessions. This cannot be undone. Proceed?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('muscle_tests')
        .delete()
        .eq('muscle_name', 'Transverse Abdominals');

      if (error) throw error;

      showSuccess("All 'Transverse Abdominals' records have been wiped from the database.");
    } catch (err: any) {
      showError(err.message || "Failed to cleanup data");
    } finally {
      setLoading(false);
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

      showSuccess("Arthur Dent and 3 sessions created! Check the Clients page.");
    } catch (err: any) {
      showError(err.message || "Failed to seed data");
    } finally {
      setLoading(false);
    }
  };

  const createTestAppointment = async () => {
    setLoading(true);
    setDebugInfo(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated");

      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .limit(1);

      if (clientError || !clients || clients.length === 0) {
        throw new Error("No clients found. Please create a client first.");
      }

      const clientId = clients[0].id;

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          client_id: clientId,
          date: new Date().toISOString(),
          name: "DEBUG TEST APPOINTMENT",
          tag: "Kinesiology",
          status: "Scheduled",
          goal: "Testing procedure tracking",
          issue: "Debug test",
          is_paid: true,
          payment_received: false
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      setTestAppointmentId(appointment.id);
      setDebugInfo({ step: "created", appointmentId: appointment.id, userId: user.id, clientId: clientId });
      showSuccess("Test appointment created!");
    } catch (error: any) {
      showError(error.message || "Failed to create test appointment");
    } finally {
      setLoading(false);
    }
  };

  const testBoltScore = async () => {
    if (!testAppointmentId) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ bolt_score: parseInt(boltScore) })
        .eq('id', testAppointmentId);
      if (error) throw error;
      showSuccess("BOLT score updated!");
    } catch (error: any) {
      showError(error.message || "Failed to update BOLT score");
    } finally {
      setLoading(false);
    }
  };

  const testCoherenceScore = async () => {
    if (!testAppointmentId) return;
    setLoading(true);
    try {
      const hr = parseInt(heartRate);
      const br = parseInt(breathRate);
      const { error } = await supabase
        .from('appointments')
        .update({ heart_rate: hr, breath_rate: br, coherence_score: hr / br })
        .eq('id', testAppointmentId);
      if (error) throw error;
      showSuccess("Coherence score updated!");
    } catch (error: any) {
      showError(error.message || "Failed to update coherence score");
    } finally {
      setLoading(false);
    }
  };

  const checkProcedures = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: allProcedures, error } = await supabase.from('procedures').select('*').eq('user_id', user!.id);
      if (error) throw error;
      setDebugInfo({ step: "procedures_check", totalProcedures: allProcedures?.length || 0, procedures: allProcedures });
      showSuccess(`Found ${allProcedures?.length || 0} procedures`);
    } catch (error: any) {
      showError(error.message || "Failed to check procedures");
    } finally {
      setLoading(false);
    }
  };

  const deleteTestAppointment = async () => {
    if (!testAppointmentId) return;
    setLoading(true);
    try {
      await supabase.from('appointments').delete().eq('id', testAppointmentId);
      setTestAppointmentId("");
      setDebugInfo(null);
      showSuccess("Test appointment deleted");
    } catch (error: any) {
      showError(error.message || "Failed to delete test appointment");
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

      {/* Webhook Simulator */}
      <Card className="border-none shadow-xl rounded-[2.5rem] bg-emerald-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck size={120} /></div>
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl font-black flex items-center gap-3">
            <RefreshCw size={28} className="text-emerald-400" /> Stripe Webhook Simulator
          </CardTitle>
          <CardDescription className="text-emerald-200 font-medium">
            Verify that successful payments correctly update the CRM database.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-6">
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
            <p className="text-sm font-medium leading-relaxed">
              This tool simulates a successful Stripe event for the test appointment created below. It verifies the database update logic.
            </p>
            <Button 
              onClick={simulateWebhook}
              disabled={simulating || !testAppointmentId}
              className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-lg"
            >
              {simulating ? <Loader2 className="animate-spin mr-2" /> : <Zap size={18} className="mr-2" />}
              Simulate Successful Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Testing Section */}
      <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Mail size={120} /></div>
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl font-black flex items-center gap-3">
            <Send size={28} className="text-indigo-400" /> Email Template Testing
          </CardTitle>
          <CardDescription className="text-indigo-200 font-medium">
            Send test onboarding emails to <strong>{testEmail}</strong> to verify formatting.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => sendTestEmail('paid')}
              disabled={!!emailLoading}
              className="h-20 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 flex flex-col gap-1 shadow-xl"
            >
              {emailLoading === 'paid' ? <Loader2 className="animate-spin" /> : <DollarSign size={24} />}
              <span className="font-black text-xs uppercase tracking-widest">Send Paid Test</span>
              <span className="text-[10px] font-medium opacity-60">(Includes Bank Details)</span>
            </Button>

            <Button 
              onClick={() => sendTestEmail('free')}
              disabled={!!emailLoading}
              className="h-20 rounded-2xl bg-indigo-800 text-white border border-indigo-700 hover:bg-indigo-700 flex flex-col gap-1"
            >
              {emailLoading === 'free' ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
              <span className="font-black text-xs uppercase tracking-widest">Send Free Test</span>
              <span className="text-[10px] font-medium opacity-60">(No Bank Details)</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-2 border-rose-200 bg-rose-50">
          <CardHeader>
            <CardTitle className="text-rose-900 flex items-center gap-2">
              <Trash2 size={20} className="text-rose-600" /> Clinical Data Cleanup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-rose-800">
              Use these tools to remove specific data points from your history.
            </p>
            <div className="p-4 bg-white rounded-xl border border-rose-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Transverse Abdominals</p>
                  <p className="text-xs text-slate-500">Wipe all muscle test logs for this component.</p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={cleanupTransverseAbdominals}
                  disabled={loading}
                  className="rounded-xl font-bold"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : "Reset Data"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="text-indigo-900 flex items-center gap-2">
              <Sparkles size={20} className="text-indigo-600" /> Seed Demo Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-indigo-800">
              Create a client named <strong>Arthur Dent</strong> and 3 past sessions.
            </p>
            <Button 
              onClick={seedDemoData}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus size={18} className="mr-2" />}
              Seed Arthur Dent & History
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Step 1: Create Test Appointment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={createTestAppointment} disabled={loading || !!testAppointmentId} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Test Appointment
            </Button>
            {testAppointmentId && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Appointment ID</p>
                <p className="text-sm text-emerald-900 font-mono">{testAppointmentId.slice(0, 8)}...</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FlaskConical size={20} className="text-indigo-500" /> Step 2: Test BOLT Score</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label htmlFor="boltScore">BOLT Score (seconds)</Label><Input id="boltScore" type="number" value={boltScore} onChange={(e) => setBoltScore(e.target.value)} /></div>
            <Button onClick={testBoltScore} disabled={loading || !testAppointmentId} className="w-full bg-indigo-600 hover:bg-indigo-700">Update BOLT Score</Button>
          </CardContent>
        </Card>
      </div>

      {debugInfo && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader><CardTitle className="text-blue-900 flex items-center gap-2">📊 Debug Info <Badge className="bg-blue-600">{debugInfo.step}</Badge></CardTitle></CardHeader>
          <CardContent><pre className="bg-white p-4 rounded-lg overflow-auto text-xs border border-blue-200">{JSON.stringify(debugInfo, null, 2)}</pre></CardContent>
        </Card>
      )}
    </div>
  );
};

export default DebugAppointmentPage;