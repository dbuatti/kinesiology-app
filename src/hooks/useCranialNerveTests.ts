
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CranialNerveTest } from "@/types/crm";
import { showError } from "@/utils/toast";
import { safeParse } from "@/utils/safe-json";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { isLateralStim, cranialSideKey, nerveStimLines } from "@/components/crm/pathway-reflex-stim-data";

export function useCranialNerveTests(
  appointmentId: string | undefined,
  priorityPattern?: string | null,
  updatePriorityPattern?: (category: string, itemName: string, status: string | null, side?: 'L' | 'R') => Promise<any>
) {
  const [tests, setTests] = useState<CranialNerveTest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = useCallback(async () => {
    if (!appointmentId) return;

    try {
      const { data, error } = await supabase
        .from('cranial_nerve_tests')
        .select('*')
        .eq('appointment_id', appointmentId);

      if (error) throw error;
      setTests(data || []);
    } catch (err) {
      console.error("Error fetching cranial nerve tests:", err);
      showError("Failed to load cranial nerve tests.");
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  const updateTest = async (nerveId: string, updates: Partial<CranialNerveTest>, side?: 'L' | 'R') => {
    if (!appointmentId) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      let latestPattern = null;

      // Handle inhibition sync to priority_pattern
      if (updates.is_inhibited !== undefined && updatePriorityPattern) {
        // Find the full name to match PathwayAssessment (e.g. "CN I: Olfactory")
        const nerveData = CRANIAL_NERVES.find(n => n.id.toString() === nerveId);
        const nerveName = nerveData ? `${nerveData.name}: ${nerveData.latinName}` : `CN ${nerveId}`;
        const isLat = nerveData?.isLateralized;
        
        // Wait for the priority pattern to update and get the absolute latest pattern
        if (isLat && updates.stim_results !== undefined) {
          // Grid path: per-side stim_results are authoritative. Sync each side
          // from its own lateral stim keys so one side never mirrors to the
          // other, and stale mirrored entries heal.
          for (const s of ['L', 'R'] as const) {
            const marked = nerveStimLines(nerveData!).some(
              (_, i) => isLateralStim(nerveData!.id, i) && !!updates.stim_results![cranialSideKey(nerveData!.id, i, s)]
            );
            await updatePriorityPattern('cranialNerves', nerveName, marked ? 'Inhibited' : null, s);
          }
        } else if (isLat && !side) {
          await updatePriorityPattern('cranialNerves', nerveName, updates.is_inhibited ? 'Inhibited' : null, 'L');
          latestPattern = await updatePriorityPattern('cranialNerves', nerveName, updates.is_inhibited ? 'Inhibited' : null, 'R');
        } else if (side) {
          latestPattern = await updatePriorityPattern('cranialNerves', nerveName, updates.is_inhibited ? 'Inhibited' : null, side);
        }
        
        // Determine if the nerve is still inhibited globally (either L or R) using the latest pattern
        if (isLat && latestPattern) {
          const nervePattern = latestPattern.cranialNerves || {};
          const sidesToCheck = side ? [side] : ['L', 'R'];
          for (const s of sidesToCheck) {
            const otherSide = s === 'L' ? 'R' : 'L';
            const otherSideStatus = nervePattern[`${nerveName} (${otherSide})`] || '';
            const isOtherSideInhibited = otherSideStatus.startsWith('Inhibited');
            
            if (!updates.is_inhibited && isOtherSideInhibited) {
              updates.is_inhibited = true;
              await updatePriorityPattern('cranialNerves', nerveName, 'Inhibited', s as 'L' | 'R');
            }
          }
        }
      }

      if (updates.is_primary_priority) {
        await supabase
          .from('cranial_nerve_tests')
          .update({ is_primary_priority: false })
          .eq('appointment_id', appointmentId);
        
        setTests(prev => prev.map(t => ({ ...t, is_primary_priority: false })));
      }

      const { data: existing } = await supabase
        .from('cranial_nerve_tests')
        .select('id')
        .eq('appointment_id', appointmentId)
        .eq('nerve_id', nerveId)
        .maybeSingle();

      let data: CranialNerveTest | null = null;

      if (existing) {
        const { data: updated, error: updateErr } = await supabase
          .from('cranial_nerve_tests')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
        if (updateErr) throw updateErr;
        data = updated;
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from('cranial_nerve_tests')
          .insert({
            ...updates,
            appointment_id: appointmentId,
            nerve_id: nerveId,
            user_id: userData.user.id,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        if (insertErr) throw insertErr;
        data = inserted;
      }

      if (!data) throw new Error("No data returned");

      setTests(prev => {
        const exists = prev.some(t => t.id === data.id);
        if (exists) {
          return prev.map(t => t.id === data.id ? data : t);
        }
        return [...prev, data];
      });
    } catch (err: any) {
      console.error("Error updating cranial nerve test:", err);
      showError(err.message || "Failed to save changes.");
    }
  };

  const toggleStim = async (
    nerveId: string,
    stimKey: string,
    checked: boolean
  ) => {
    const existing = tests.find(t => t.nerve_id === nerveId);
    const current = (existing && existing.stim_results) || {};
    const next = { ...current };
    if (checked) next[stimKey] = true;
    else delete next[stimKey];
    const isInhibited = Object.values(next).some(Boolean);
    await updateTest(nerveId, {
      stim_results: next,
      is_inhibited: isInhibited
    });
  };

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  return {
    tests,
    loading,
    updateTest,
    toggleStim,
    refresh: fetchTests
  };
}