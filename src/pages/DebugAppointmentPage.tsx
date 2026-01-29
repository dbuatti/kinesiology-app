import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, FlaskConical, Activity, RefreshCw, MoreHorizontal } from "lucide-react";
import { useAppointmentMutation, useProcedures } from "@/hooks/use-crm-data";
import { useAuth } from "@/components/AuthProvider";

const DebugAppointmentPage = () => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testAppointmentId, setTestAppointmentId] = useState<string>("");
  const [boltScore, setBoltScore] = useState<string>("30");
  const [heartRate, setHeartRate] = useState<string>("72");
  const [breathRate, setBreathRate] = useState<string>("12");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const { mutateAsync: updateAppointment, isLoading: isUpdating } = useAppointmentMutation();
  const { data: procedures, refetch: refetchProcedures, isLoading: isProceduresLoading } = useProcedures();

  const createTestAppointment = async () => {
    setLoading(true);
    setDebugInfo(null);

    try {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      console.log("[DEBUG] Getting user...");
      const user_id = session.user.id;
      console.log("[DEBUG] User ID:", user_id);

      // Get first client
      console.log("[DEBUG] Fetching clients...");
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user_id)
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
          user_id: user_id,
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
        userId: user_id,
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
      const score = parseInt(boltScore);
      console.log("[DEBUG] Updating BOLT score to:", score);
      
      await updateAppointment({
        id: testAppointmentId,
        bolt_score: score,
      });

      // Wait a bit for trigger to fire and React Query to refetch
      await new Promise(resolve => setTimeout(resolve, 1500));
      await refetchProcedures();

      const boltProcedures = procedures?.filter(p => p.name.toLowerCase().includes('bolt'));

      setDebugInfo({
        step: "bolt_updated",
        boltScore: score,
        proceduresFound: boltProcedures?.length || 0,
        procedures: boltProcedures
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

      await updateAppointment({
        id: testAppointmentId,
        heart_rate: hr,
        breath_rate: br,
        coherence_score: coherenceScore,
      });

      // Wait a bit for trigger to fire and React Query to refetch
      await new Promise(resolve => setTimeout(resolve, 1500));
      await refetchProcedures();

      const coherenceProcedures = procedures?.filter(p => p.name.toLowerCase().includes('coherence'));

      setDebugInfo({
        step: "coherence_updated",
        heartRate: hr,
        breathRate: br,
        coherenceScore: coherenceScore,
        proceduresFound: coherenceProcedures?.length || 0,
        procedures: coherenceProcedures
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
      const { data: allProcedures } = await refetchProcedures();

      console.log("[DEBUG] All procedures:", allProcedures?.data);

      setDebugInfo({
        step: "procedures_check",
        totalProcedures: allProcedures?.data?.length || 0,
        procedures: allProcedures?.data
      });

      showSuccess(`Found ${allProcedures?.data?.length || 0} procedures`);
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

  const isAnyLoading = loading || isUpdating || isProceduresLoading;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">🔧 Debug Procedures</h1>
        <p className="text-slate-500 mt-2">Test procedure auto-tracking functionality</p>
      </div>

      <Card className="border-2 border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2">
            ⚠️ Debug Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-800">
          <p>This page helps debug the procedure tracking system.</p>
          <p className="font-bold">Open your browser console (F12) to see detailed logs!</p>
          <p>All logs start with <code className="bg-amber-100 px-1 rounded">[DEBUG]</code></p>
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
              disabled={isAnyLoading || !!testAppointmentId}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isAnyLoading && !testAppointmentId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
              disabled={isAnyLoading || !testAppointmentId}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isAnyLoading && !testAppointmentId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
              disabled={isAnyLoading || !testAppointmentId}
              className="w-full bg-rose-600 hover:bg-rose-700"
            >
              {isAnyLoading && !testAppointmentId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
              disabled={isAnyLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isAnyLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Check All Procedures
            </Button>
            {testAppointmentId && (
              <Button 
                onClick={deleteTestAppointment}
                disabled={isAnyLoading}
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