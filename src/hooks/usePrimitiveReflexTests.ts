
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PrimitiveReflexTest } from "@/types/crm";
import { showError } from "@/utils/toast";
import { safeParse } from "@/utils/safe-json";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";

export function usePrimitiveReflexTests(
  appointmentId: string | undefined,
  priorityPattern?: string | null,
  updatePriorityPattern?: (category: string, itemName: string, status: string | null, side?: 'L' | 'R') => Promise<any>
) {
  const [tests, setTests] = useState<PrimitiveReflexTest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = useCallback(async () => {
    if (!appointmentId) return;

    try {
      const { data, error } = await supabase
        .from('primitive_reflex_tests')
        .select('*')
        .eq('appointment_id', appointmentId);

      if (error) throw error;
      setTests(data || []);
    } catch (err) {
      console.error("Error fetching primitive reflex tests:", err);
      showError("Failed to load primitive reflex tests.");
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  const updateTest = async (reflexId: string, updates: Partial<PrimitiveReflexTest>, side?: 'L' | 'R', reflexName?: string) => {
    if (!appointmentId) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      let latestPattern = null;

      // Handle inhibition sync to priority_pattern
      if (updates.is_inhibited !== undefined && updatePriorityPattern) {
        // Use the display name for the pattern key, fallback to ID
        const patternKey = reflexName || reflexId;
        const reflexData = PRIMITIVE_REFLEXES.find(r => r.id === reflexId || r.name === reflexName);
        const isLat = reflexData?.isLateralized;

        if (isLat && !side) {
          await updatePriorityPattern('primitiveReflexes', patternKey, updates.is_inhibited ? 'Inhibited' : 'Clear', 'L');
          latestPattern = await updatePriorityPattern('primitiveReflexes', patternKey, updates.is_inhibited ? 'Inhibited' : 'Clear', 'R');
        } else {
          latestPattern = await updatePriorityPattern('primitiveReflexes', patternKey, updates.is_inhibited ? 'Inhibited' : 'Clear', side);
        }
        
        // Determine if the reflex is still inhibited globally (either L or R) using the latest pattern
        if (side && latestPattern) {
          const otherSide = side === 'L' ? 'R' : 'L';
          const reflexPattern = latestPattern.primitiveReflexes || {};
          const otherSideStatus = reflexPattern[`${patternKey} (${otherSide})`] || '';
          const isOtherSideInhibited = otherSideStatus.startsWith('Inhibited');
          
          if (!updates.is_inhibited && isOtherSideInhibited) {
            updates.is_inhibited = true;
          }
        }
      }

      if (updates.is_primary_priority) {
        await supabase
          .from('primitive_reflex_tests')
          .update({ is_primary_priority: false })
          .eq('appointment_id', appointmentId);
        
        setTests(prev => prev.map(t => ({ ...t, is_primary_priority: false })));
      }

      const { data, error } = await supabase
        .from('primitive_reflex_tests')
        .upsert({
          ...updates,
          appointment_id: appointmentId,
          reflex_id: reflexId,
          user_id: userData.user.id,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'appointment_id,reflex_id' 
        })
        .select()
        .single();

      if (error) throw error;

      setTests(prev => {
        const exists = prev.some(t => t.id === data.id);
        if (exists) {
          return prev.map(t => t.id === data.id ? data : t);
        }
        return [...prev, data];
      });
    } catch (err: any) {
      console.error("Error updating primitive reflex test:", err);
      showError(err.message || "Failed to save changes.");
    }
  };

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  return {
    tests,
    loading,
    updateTest,
    refresh: fetchTests
  };
}