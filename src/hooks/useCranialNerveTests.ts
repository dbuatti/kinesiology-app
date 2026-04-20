"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CranialNerveTest } from "@/types/crm";
import { showError } from "@/utils/toast";
import { safeParse } from "@/utils/safe-json";

export function useCranialNerveTests(
  appointmentId: string | undefined,
  priorityPattern?: string | null,
  updatePriorityPattern?: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>
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

      // Handle inhibition sync to priority_pattern
      if (updates.is_inhibited !== undefined && updatePriorityPattern) {
        const nerveName = `CN ${nerveId}`;
        await updatePriorityPattern('cranialNerves', nerveName, updates.is_inhibited ? 'Inhibited' : 'Clear', side);
        
        // Determine if the nerve is still inhibited globally (either L or R)
        if (side) {
          const otherSide = side === 'L' ? 'R' : 'L';
          const pattern = safeParse(priorityPattern, {} as any);
          const nervePattern = pattern.cranialNerves || {};
          const isOtherSideInhibited = nervePattern[`${nerveName} (${otherSide})`] === 'Inhibited';
          
          // If we are unchecking one side, but the other side is still inhibited, 
          // keep the global is_inhibited as true in the cranial_nerve_tests table.
          if (!updates.is_inhibited && isOtherSideInhibited) {
            updates.is_inhibited = true;
          }
        }
      }

      // If setting primary priority, unset others in the local state and DB
      if (updates.is_primary_priority) {
        await supabase
          .from('cranial_nerve_tests')
          .update({ is_primary_priority: false })
          .eq('appointment_id', appointmentId);
        
        setTests(prev => prev.map(t => ({ ...t, is_primary_priority: false })));
      }

      // Use upsert to avoid 409 Conflict errors
      const { data, error } = await supabase
        .from('cranial_nerve_tests')
        .upsert({
          ...updates,
          appointment_id: appointmentId,
          nerve_id: nerveId,
          user_id: userData.user.id,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'appointment_id,nerve_id' 
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
      console.error("Error updating cranial nerve test:", err);
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