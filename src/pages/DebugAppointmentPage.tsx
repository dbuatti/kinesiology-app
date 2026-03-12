import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, FlaskConical, Activity, RefreshCw, Sparkles, UserPlus } from "lucide-react";
import { subDays } from "date-fns";

const DebugAppointmentPage = () => {
  const [loading, setLoading] = useState(false);
  const [testAppointmentId, setTestAppointmentId] = useState<string>("");
  const [boltScore, setBoltScore] = useState<string>("30");
  const [heartRate, setHeartRate] = useState<string>("72");
  const [breathRate, setBreathRate] = useState<string>("12");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const seedDemoData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Create Arthur Dent
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

      // 2. Create 3 sessions with evolving patterns
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
      console.log("[DEBUG] Getting user...");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      console.log("[DEBUG] User ID:", user.id);

      // Get first client
      console.log("[DEBUG] Fetching clients...");
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .limit(1);

      if (clientError || !clients || clients.length === 0) {
        throw new Error("No clients found. Please create a client first.");
      }

      const clientId = clients[0].id;
      console.log("[DEBUG] Using client ID:", clientId);

      // Create test appointment
      console.log("[DEBUG] Creating test appointment...");
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          client_id: clientId,
          date: new Date().toISOString(),
          name: "DEBUG TEST APPOINTMENT",
          tag: "Kinesiology",
          status: "Completed",
          goal: "Testing procedure tracking",
          issue: "Debug test"
        })
        .select()
        .single();

      if (appointmentError) {
        console.error("[DEBUG] Error creating appointment:", appointmentError);
        throw appointmentError;
      }

      console.log("[DEBUG] Test appointment created:", appointment);
      setTestAppointmentId(appointment.id);
      
      setDebugInfo({
        step: "created",
        appointmentId: appointment.id,
        userId: user.id,
        clientId: clientId
      });

      showSuccess("Test appointment created! ID: " + appointment.id.slice(0, 8));
    } catch (error: any) {
      console.error("[DEBUG] Error:", error);
      showError(error.message || "Failed to create test appointment");
    } finally {
      setLoading(false);
    }
  };

  const testBoltScore = async () => {
    if (!testAppointmentId) {
      showError("Create a test appointment first");
      return;
    }

    setLoading(true);

    try {
      console.log("[DEBUG] Updating BOLT score to:", boltScore);
      
      const { data: before, error: beforeError } = await supabase
        .from('appointments')
        .select('bolt_score, user_id')
        .eq('id', testAppointmentId)
        .single();

      console.log("[DEBUG] Before update:", before);

      const { data, error } = await supabase
        .from('appointments')
        .update({ bolt_score: parseInt(boltScore) })
        .eq('id', testAppointmentId)
        .select();

      if (error) {
        console.error("[DEBUG] Error updating BOLT score:", error);
        throw error;
      }

      console.log("[DEBUG] Update result:", data);

      // Wait a bit for trigger to fire
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if procedure was created
      const { data: { user } } = await supabase.auth.getUser();
      const { data: procedures, error: procError } = await supabase
        .from('procedures')
        .select('*')
        .eq('user_id', user!.id)
        .ilike('name', '%bolt%');

      console.log("[DEBUG] BOLT procedures found:", procedures);

      setDebugInfo({
        step: "bolt_updated",
        boltScore: parseInt(boltScore),
        proceduresFound: procedures?.length || 0,
        procedures: procedures
      });

      showSuccess("BOLT score updated! Check console and procedures.");
    } catch (error: any) {
      console.error("[DEBUG] Error:", error);
      showError(error.message || "Failed to update BOLT score");
    } finally {
      setLoading(false);
    }
  };

  const testCoherenceScore = async () => {
    if (!testAppointmentId) {
      showError("Create a test appointment first");
      return;
    }

    setLoading(true);

    try {
      const hr = parseInt(heartRate);
      const br = parseInt(breathRate);
      const coherenceScore = hr / br;

      console.log("[DEBUG] Updating coherence - HR:", hr, "BR:", br, "Score:", coherenceScore);

      const { data: before, error: beforeError } = await supabase
        .from('appointments')
        .select('coherence_score, heart_rate, breath_rate, user_id')
        .eq('id', testAppointmentId)
        .single();

      console.log("[DEBUG] Before update:", before);

      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          heart_rate: hr,
          breath_rate: br,
          coherence_score: coherenceScore 
        })
        .eq('id', testAppointmentId)
        .select();

      if (error) {
        console.error("[DEBUG] Error updating coherence:", error);
        throw error;
      }

      console.log("[DEBUG] Update result:", data);

      // Wait a bit for trigger to fire
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if procedure was created
      const { data: { user } } = await supabase.auth.getUser();
      const { data: procedures, error: procError } = await supabase
        .from('procedures')
        .select('*')
        .eq('user_id', user!.id)
        .ilike('name', '%coherence%');

      console.log("[DEBUG] Coherence procedures found:", procedures);

      setDebugInfo({
        step: "coherence_updated",
        heartRate: hr,
        breathRate: br,
        coherenceScore: coherenceScore,
        proceduresFound: procedures?.length || 0,
        procedures: procedures
      });

      showSuccess("Coherence score updated! Check console and procedures.");
    } catch (error: any) {
      console.error("[DEBUG] Error:", error);
      showError(error.message || "Failed to update coherence score");
    } finally {
      setLoading(false);
    }
  };

  const checkProcedures = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: allProcedures, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;

      console.log("[DEBUG] All procedures:", allProcedures);

      setDebugInfo({
        step: "procedures_check",
        totalProcedures: allProcedures?.length || 0,
        procedures: allProcedures
      });

      showSuccess(`Found ${allProcedures?.length || 0} procedures`);
    } catch (error: any) {
      console.error("[DEBUG] Error:", error);
      showError(error.message || "Failed to check procedures");
    } finally {
      setLoading(false);
    }
  };

  const deleteTestAppointment = async () => {
    if (!testAppointmentId) {
      showError("No test appointment to delete");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', testAppointmentId);

      if (error) throw error;

      console.log("[DEBUG] Test appointment deleted");
      setTestAppointmentId("");
      setDebugInfo(null);
      showSuccess("Test appointment deleted");
    } catch (error: any) {
      console.error("[DEBUG] Error:", error);
      showError(error.message || "Failed to delete test appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">🔧 Debug Procedures</h1>
        <p className="text-slate-500 mt-2">Test procedure auto-tracking functionality</p>
      </div>

      <Card className="border-2 border-indigo-200 bg-indigo-50">
        <CardHeader>
          <CardTitle className="text-indigo-900 flex items-center gap-2">
            <Sparkles size={20} className="text-indigo-600" /> Seed Demo Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-indigo-800">
            This will create a client named <strong>Arthur Dent</strong> and 3 past sessions with evolving neurological findings. 
            Use this to test the <strong>Neurological Evolution</strong> grid and <strong>Brainstem Tone Map</strong> on the real Clients page.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 1: Create Test Appointment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={createTestAppointment}
              disabled={loading || !!testAppointmentId}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
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
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical size={20} className="text-indigo-500" />
              Step 2: Test BOLT Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="boltScore">BOLT Score (seconds)</Label>
              <Input
                id="boltScore"
                type="number"
                value={boltScore}
                onChange={(e) => setBoltScore(e.target.value)}
                placeholder="30"
              />
            </div>
            <Button 
              onClick={testBoltScore}
              disabled={loading || !testAppointmentId}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update BOLT Score
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity size={20} className="text-rose-500" />
              Step 3: Test Coherence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="heartRate">Heart Rate</Label>
                <Input
                  id="heartRate"
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  placeholder="72"
                />
              </div>
              <div>
                <Label htmlFor="breathRate">Breath Rate</Label>
                <Input
                  id="breathRate"
                  type="number"
                  value={breathRate}
                  onChange={(e) => setBreathRate(e.target.value)}
                  placeholder="12"
                />
              </div>
            </div>
            <Button 
              onClick={testCoherenceScore}
              disabled={loading || !testAppointmentId}
              className="w-full bg-rose-600 hover:bg-rose-700"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Coherence Score
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 4: Check Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={checkProcedures}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Check All Procedures
            </Button>
            {testAppointmentId && (
              <Button 
                onClick={deleteTestAppointment}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                Delete Test Appointment
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {debugInfo && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              📊 Debug Info
              <Badge className="bg-blue-600">{debugInfo.step}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-white p-4 rounded-lg overflow-auto text-xs border border-blue-200">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">📝 Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>Open browser console</strong> (F12 or right-click → Inspect → Console)</li>
            <li><strong>Create test appointment</strong> - This creates a dummy appointment</li>
            <li><strong>Test BOLT score</strong> - Updates the appointment with a BOLT score</li>
            <li><strong>Test Coherence</strong> - Updates the appointment with coherence data</li>
            <li><strong>Check procedures</strong> - See if procedures were auto-created</li>
            <li><strong>Check console logs</strong> - Look for [DEBUG] messages</li>
            <li><strong>Go to Procedures page</strong> - Verify procedures appear there</li>
            <li><strong>Clean up</strong> - Delete the test appointment when done</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugAppointmentPage;