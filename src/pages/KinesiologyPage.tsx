import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/crm/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import LuscherColourAssessment from "@/components/crm/LuscherColourAssessment";
import EmotionAssessment from "@/components/crm/EmotionAssessment";

interface KinesiologyData {
  clientName: string;
  emotion_mode: string | null;
  emotion_primary_selection: string | null;
  emotion_secondary_selection: string[] | null;
  emotion_notes: string | null;
  luscher_color_1: string | null;
  luscher_color_2: string | null;
}

const KinesiologyPage = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<KinesiologyData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchKinesiologyData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: appData, error } = await supabase
        .from('appointments')
        .select(`
          clients(name),
          emotion_mode,
          emotion_primary_selection,
          emotion_secondary_selection,
          emotion_notes,
          luscher_color_1,
          luscher_color_2
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      setData({
        clientName: appData.clients?.[0]?.name || 'Unknown Client',
        emotion_mode: appData.emotion_mode,
        emotion_primary_selection: appData.emotion_primary_selection,
        emotion_secondary_selection: appData.emotion_secondary_selection || [],
        emotion_notes: appData.emotion_notes,
        luscher_color_1: appData.luscher_color_1,
        luscher_color_2: appData.luscher_color_2,
      });
    } catch (err) {
      console.error("Error fetching kinesiology data:", err);
      showError("Failed to load kinesiology assessment data.");
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscription for seamless sync
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`kinesiology-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `id=eq.${id}`
        },
        (payload) => {
          setData((prev) => {
            if (!prev) return prev;
            return { 
              ...prev, 
              emotion_mode: payload.new.emotion_mode,
              emotion_primary_selection: payload.new.emotion_primary_selection,
              emotion_secondary_selection: payload.new.emotion_secondary_selection || [],
              emotion_notes: payload.new.emotion_notes,
              luscher_color_1: payload.new.luscher_color_1,
              luscher_color_2: payload.new.luscher_color_2,
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    fetchKinesiologyData();
  }, [id]);

  const saveField = async (field: string, value: string | boolean | null | string[]) => {
    if (!id) return;

    const normalized = Array.isArray(value) 
      ? value 
      : (typeof value === 'string' 
        ? (value.trim() === '' ? null : value.trim()) 
        : value);

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ [field]: normalized })
        .eq('id', id);

      if (error) throw error;
      // Real-time subscription handles state update, no need to force update here.
    } catch (err: any) {
      console.error(`Silent save failed for ${field}:`, err);
      showError(`Failed to save ${field}.`);
    }
  };

  const handleSaveColors = async (color1: string | null, color2: string | null) => {
    await saveField('luscher_color_1', color1);
    await saveField('luscher_color_2', color2);
  };

  if (!id) return <div className="p-8 text-center">Invalid Appointment ID</div>;

  if (loading || !data) return (
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
            <Heart size={24} className="text-red-600" /> Energetic & Emotional Assessments
          </CardTitle>
          <CardDescription>
            Luscher Colour and Emotional Assessment for {data.clientName} (Session ID: {id.slice(0, 8)}...)
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-8">
        <LuscherColourAssessment
          appointmentId={id}
          initialColor1={data.luscher_color_1}
          initialColor2={data.luscher_color_2}
          onSaveColors={handleSaveColors}
        />
        <EmotionAssessment
          appointmentId={id}
          initialMode={data.emotion_mode}
          initialPrimary={data.emotion_primary_selection}
          initialSecondary={data.emotion_secondary_selection}
          initialNotes={data.emotion_notes}
          onSaveField={saveField}
          onUpdate={fetchKinesiologyData}
        />
      </div>
    </AppLayout>
  );
};

export default KinesiologyPage;