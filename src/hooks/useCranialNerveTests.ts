"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CranialNerveTest } from "@/types/crm";
import { showError } from "@/utils/toast";
import { safeParse } from "@/utils/safe-json";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";

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
        
        // Wait for the priority pattern to update and get the absolute latest pattern
        latestPattern = await updatePriorityPattern('cranialNerves', nerveName, updates.is_inhibited ? 'Inhibited' : 'Clear', side);
        
        // Determine if the nerve is still inhibited globally (either L or R) using the latest pattern
        if (side && latestPattern) {
          const otherSide = side === 'L' ? 'R' : 'L';
          const nervePattern = latestPattern.cranialNerves || {};
          const otherSideStatus = nervePattern[`${nerveName} (${otherSide})`] || '';
          const isOtherSideInhibited = otherSideStatus.startsWith('Inhibited');
          
          if (!updates.is_inhibited && isOtherSideInhibited) {
            updates.is_inhibited = true;
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