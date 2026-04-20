"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PrimitiveReflexTest } from "@/types/crm";
import { showError } from "@/utils/toast";

export function usePrimitiveReflexTests(
  appointmentId: string | undefined,
  priorityPattern?: string | null,
  updatePriorityPattern?: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>
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

  const updateTest = async (reflexId: string, updates: Partial<PrimitiveReflexTest>, side?: 'L' | 'R') => {
    if (!appointmentId) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      const existingTest = tests.find(t => t.reflex_id === reflexId);

      // Handle inhibition sync to priority_pattern
      if (updates.is_inhibited !== undefined && updatePriorityPattern) {
        // We need the reflex name for the pattern. reflexId is usually the name or a slug.
        // For primitive reflexes, we'll use the ID as the name in the pattern.
        await updatePriorityPattern('primitiveReflexes', reflexId, updates.is_inhibited ? 'Inhibited' : 'Clear', side);
      }

      // If setting primary priority, unset others in the local state and DB
      if (updates.is_primary_priority) {
        await supabase
          .from('primitive_reflex_tests')
          .update({ is_primary_priority: false })
          .eq('appointment_id', appointmentId);
        
        setTests(prev => prev.map(t => ({ ...t, is_primary_priority: false })));
      }

      if (existingTest) {
        const { data, error } = await supabase
          .from('primitive_reflex_tests')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', existingTest.id)
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
      } else {
        const { data, error } = await supabase
          .from('primitive_reflex_tests')
          .insert([{
            ...updates,
            appointment_id: appointmentId,
            reflex_id: reflexId,
            user_id: userData.user.id
          }])
          .select()
          .single();

        if (error) throw error;
        setTests(prev => [...prev, data]);
      }
    } catch (err) {
      console.error("Error updating primitive reflex test:", err);
      showError("Failed to save changes.");
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