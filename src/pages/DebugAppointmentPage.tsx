import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { 
  Loader2, FlaskConical, Activity, RefreshCw, Sparkles, 
  UserPlus, Trash2, AlertTriangle, Mail, Send, 
  DollarSign, CheckCircle2, ShieldCheck, Zap, Heart,
  Globe, CreditCard, Beaker, ArrowRight, Info, Clock,
  CalendarClock, MoveRight, Bug
} from "lucide-react";
import { addHours, format, addMinutes, setHours, setMinutes, addDays } from "date-fns";
import { CALCOM_CONFIG } from "@/config/integrations";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";

const DebugAppointmentPage = () => {
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("daniele.buatti@gmail.com");
  const [debugClient, setDebugClient] = useState<any>(null);
  const [debugApp, setDebugApp] = useState<any>(null);
  const [activeTest, setActiveTest] = useState<string | null>(null);

  // 1. Setup Test Environment
  const setupTestEnvironment = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create/Update Test Client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .upsert({
          user_id: user.id,
          name: "DEBUG TESTER",
          email: testEmail.toLowerCase().trim(),
          pronouns: "Test/Bot",
          occupation: "Quality Assurance"
        }, { onConflict: 'email' })
        .select()
        .single();

      if (clientError) throw clientError;
      setDebugClient(client);

      // Create Test Appointment with a dummy Cal.com ID for webhook testing
      const { data: app, error: appError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          client_id: client.id,
          date: new Date().toISOString(),
          tag: "Debug Test",
          status: "Scheduled",
          is_paid: true,
          payment_received: false,
          price_amount: 50,
          price_currency: 'AUD',
          calcom_booking_id: "DEBUG-BOOKING-123" // Dummy ID for matching
        })
        .select()
        .single();

      if (appError) throw appError;
      setDebugApp(app);

      showSuccess("Test environment ready!");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Test Kit Sync
  const testKitSync = async () => {
    if (!debugClient) return showError("Setup environment first");
    setActiveTest('kit');
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-kit', {
        body: { record: debugClient }
      });
      if (error) throw error;
      showSuccess("Kit Sync Function Invoked Successfully");
    } catch (err: any) {
      showError(`Kit Error: ${err.message}`);
    } finally {
      setActiveTest(null);
    }
  };

  // 3. Test Stripe Sync
  const testStripeSync = async () => {
    if (!debugClient) return showError("Setup environment first");
    setActiveTest('stripe');
    try {
      const { data, error } = await supabase.functions.invoke('stripe-manager', {
        body: { 
          action: 'sync-customer', 
          clientId: debugClient.id,
          clientData: debugClient
        }
      });
      if (error) throw error;
      showSuccess("Stripe Sync Function Invoked Successfully");
    } catch (err: any) {
      showError(`Stripe Error: ${err.message}`);
    } finally {
      setActiveTest(null);
    }
  };

  // 4. Test Email Onboarding
  const testEmailOnboarding = async () => {
    if (!debugClient || !debugApp) return showError("Setup environment first");
    setActiveTest('email');
    try {
      const { data, error } = await supabase.functions.invoke('send-manual-onboarding', {
        body: { 
          clientId: debugClient.id,
          appointmentId: debugApp.id,
          force: true // Bypass the 6-month rule for debugging
        }
      });
      if (error) throw error;
      showSuccess("Email Function Invoked Successfully");
    } catch (err: any) {
      showError(`Email Error: ${err.message}`);
    } finally {
      setActiveTest(null);
    }
  };

  // 5. Automated Reschedule Test (Webhook Simulation)
  const simulateReschedule = async () => {
    if (!debugApp) return showError("Setup environment first");
    setActiveTest('reschedule');
    try {
      const newTime = addHours(new Date(debugApp.date), 2).toISOString();
      
      // Mock Cal.com Webhook Payload
      const payload = {
        triggerEvent: "BOOKING_RESCHEDULED",
        payload: {
          bookingId: "DEBUG-BOOKING-123",
          startTime: newTime,
          attendees: [{ name: "DEBUG TESTER", email: testEmail }],
          eventTypeId: parseInt(CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID)
        }
      };

      const { error } = await supabase.functions.invoke('calcom-webhook', {
        body: payload
      });

      if (error) throw error;
      
      showSuccess(`Reschedule simulated! App moved to ${format(new Date(newTime), "h:mm a")}`);
      
      // Refresh local state to show the change
      const { data: updatedApp } = await supabase.from('appointments').select('*').eq('id', debugApp.id).single();
      setDebugApp(updatedApp);
    } catch (err: any) {
      showError(`Reschedule Error: ${err.message}`);
    } finally {
      setActiveTest(null);
    }
  };

  // 6. Automated Off-Grid Booking Test
  const testOffGridBooking = async () => {
    if (!debugClient) return showError("Setup environment first");
    setActiveTest('offgrid');
    try {
      // Create a "messy" time: Next Tuesday at 10:07 AM (More likely to be available)
      let targetDate = addDays(new Date(), 2);
      // Ensure it's a weekday (Monday-Friday)
      while (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
        targetDate = addDays(targetDate, 1);
      }
      
      const messyTime = setMinutes(setHours(targetDate, 10), 7).toISOString();

      const { data, error } = await supabase.functions.invoke('create-calcom-booking', {
        body: {
          clientId: debugClient.id,
          startTime: messyTime,
          eventTypeId: CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID,
          title: "DEBUG: Off-Grid Test",
          is_paid: true
        }
      });

      if (error) throw error;
      showSuccess(`Off-grid booking created for ${format(new Date(messyTime), "EEEE, MMM d @ h:mm a")}!`);
    } catch (err: any) {
      showError(`Off-Grid Error: ${err.message}`);
    } finally {
      setActiveTest(null);
    }
  };

  const cleanupTestData = async () => {
    if (!debugClient) return;
    setLoading(true);
    try {
      await supabase.from('appointments').delete().eq('client_id', debugClient.id);
      await supabase.from('clients').delete().eq('id', debugClient.id);
      setDebugClient(null);
      setDebugApp(null);
      showSuccess("Test data purged.");
    } catch (err) {
      showError("Cleanup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout variant="workspace">
      <div className="space-y-10 animate-in fade-in duration-700">
        <PageHeader 
          title="System Debug"
          subtitle="Automation lab and integration testing tools."
          icon={Bug}
          breadcrumbs={[{ label: "System", path: "/settings" }, { label: "Debug" }]}
        />

        {/* Onboarding Debug Suite */}
        <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-5"><Beaker size={200} /></div>
          <CardHeader className="p-10 pb-6 relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
                <Beaker size={28} className="text-white" />
              </div>
              <div>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-black text-[10px] uppercase tracking-widest mb-1 rounded-full">Automation Lab</Badge>
                <CardTitle className="text-3xl font-black">Integration Debug Suite</CardTitle>
              </div>
            </div>
            <CardDescription className="text-slate-400 text-lg font-medium">
              Test the full automation chain and Cal.com logic.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-0 space-y-10 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Test Email Address</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={testEmail} 
                      onChange={e => setTestEmail(e.target.value)}
                      className="bg-white/5 border-white/10 text-white h-12 rounded-xl font-bold"
                      placeholder="your@email.com"
                    />
                    <Button 
                      onClick={setupTestEnvironment} 
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-xl font-bold"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : "1. Create Test Env"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">This creates a dummy client and appointment in your database.</p>
                </div>

                {debugClient && (
                  <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-4 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-xs uppercase tracking-widest text-indigo-300">Active Test Environment</h4>
                      <Button variant="ghost" size="sm" onClick={cleanupTestData} className="h-7 text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                        <Trash2 size={12} className="mr-1" /> Purge Test Data
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase">Client ID</p>
                        <p className="text-[10px] font-mono text-slate-300 truncate">{debugClient.id}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase">App ID</p>
                        <p className="text-[10px] font-mono text-slate-300 truncate">{debugApp?.id}</p>
                      </div>
                    </div>
                    {debugApp && (
                      <div className="pt-2 border-t border-white/5">
                        <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Current App Time</p>
                        <p className="text-sm font-bold text-emerald-400">{format(new Date(debugApp.date), "EEEE, MMM d @ h:mm a")}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Cal.com Integration Lab</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      variant="outline" 
                      disabled={!debugApp || !!activeTest}
                      onClick={simulateReschedule}
                      className="h-16 justify-between px-6 rounded-2xl border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-white group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                          <CalendarClock size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm">Test: External Reschedule</p>
                          <p className="text-[10px] text-slate-500">Simulates Cal.com moving the session +2hrs</p>
                        </div>
                      </div>
                      {activeTest === 'reschedule' ? <Loader2 className="animate-spin" /> : <MoveRight size={18} className="opacity-0 group-hover:opacity-100 transition-all" />}
                    </Button>

                    <Button 
                      variant="outline" 
                      disabled={!debugClient || !!activeTest}
                      onClick={testOffGridBooking}
                      className="h-16 justify-between px-6 rounded-2xl border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 text-white group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <Clock size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm">Test: Off-Grid Booking</p>
                          <p className="text-[10px] text-slate-500">Forces a booking at 10:07 AM (Weekday)</p>
                        </div>
                      </div>
                      {activeTest === 'offgrid' ? <Loader2 className="animate-spin" /> : <Zap size={18} className="opacity-0 group-hover:opacity-100 transition-all" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Other Triggers</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!debugClient || !!activeTest}
                      onClick={testKitSync}
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-white text-[10px] font-bold uppercase"
                    >
                      {activeTest === 'kit' ? <Loader2 className="animate-spin mr-2" /> : <Globe size={14} className="mr-2" />}
                      Kit Sync
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={!debugClient || !!activeTest}
                      onClick={testEmailOnboarding}
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-white text-[10px] font-bold uppercase"
                    >
                      {activeTest === 'email' ? <Loader2 className="animate-spin mr-2" /> : <Mail size={14} className="mr-2" />}
                      Email Test
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-amber-500/10 rounded-[2rem] border border-amber-500/20 flex items-start gap-4">
              <Info size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black text-amber-400 uppercase tracking-widest">How to Debug</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  After clicking a trigger button, open your **Supabase Console {' > '} Edge Functions**, select the corresponding function, and check the **Logs** tab. Any API errors from Kit, Stripe, or Gmail will appear there in real-time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                {loading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles size={18} className="mr-2" />}
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
                disabled={loading || !debugApp}
                className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-lg"
              >
                {loading ? <Loader2 className="mr-2 animate-spin" /> : <Zap size={18} className="mr-2" />}
                Simulate Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );

  // Helper functions moved inside component for state access
  async function seedSusansWin() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from('client_wins').insert({
        user_id: user.id,
        client_name: "Susan Lord",
        content: "Slept like a baby — 9 hours and no wake ups or bad dreams — feeling good 🤗",
        context: "Post-session feedback"
      });
      if (error) throw error;
      showSuccess("Susan's win added!");
    } catch (err: any) { showError(err.message); } finally { setLoading(false); }
  }

  async function simulateWebhook() {
    if (!debugApp) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('appointments').update({ payment_received: true, payment_method: 'Stripe (Simulated)' }).eq('id', debugApp.id);
      if (error) throw error;
      showSuccess("Payment simulated!");
    } catch (err: any) { showError(err.message); } finally { setLoading(false); }
  }
};

export default DebugAppointmentPage;