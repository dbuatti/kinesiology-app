import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Dumbbell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MuscleTestingTab from "@/components/crm/MuscleTestingTab";
import AppLayout from "@/components/crm/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

const MuscleTestingPage = () => {
  const { id } = useParams<{ id: string }>();
  const [clientName, setClientName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchClientName = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`clients(name)`)
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setClientName(data.clients?.[0]?.name || 'Unknown Client');
      } catch (err) {
        console.error("Error fetching client name:", err);
        showError("Failed to load appointment context.");
      } finally {
        setLoading(false);
      }
    };
    fetchClientName();
  }, [id]);

  if (!id) return <div className="p-8 text-center">Invalid Appointment ID</div>;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <Link to={`/appointments/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={18} className="mr-2" /> Back to Session
          </Button>
        </Link>
      </div>
      
      <Card className="border-none shadow-lg rounded-2xl bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-2xl">
          <CardTitle className="text-2xl font-bold flex items-center gap-3 text-slate-900">
            <Dumbbell size={24} className="text-indigo-600" /> Muscle Testing Log
          </CardTitle>
          <CardDescription>
            Logging muscle test results for {clientName} (Session ID: {id.slice(0, 8)}...)
          </CardDescription>
        </CardHeader>
      </Card>

      <MuscleTestingTab appointmentId={id} />
    </AppLayout>
  );
};

export default MuscleTestingPage;