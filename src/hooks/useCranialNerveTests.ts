"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CranialNerveTest } from "@/types/crm";
import { showError } from "@/utils/toast";

export function useCranialNerveTests(appointmentId: string | undefined) {
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

  const updateTest = async (nerveId: string, updates: Partial<CranialNerveTest>) => {
    if (!appointmentId) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      const existingTest = tests.find(t => t.nerve_id === nerveId);

      // If setting primary priority, unset others in the local state and DB
      if (updates.is_primary_priority) {
        await supabase
          .from('cranial_nerve_tests')
          .update({ is_primary_priority: false })
          .eq('appointment_id', appointmentId);
        
        setTests(prev => prev.map(t => ({ ...t, is_primary_priority: false })));
      }

      if (existingTest) {
        const { data, error } = await supabase
          .from('cranial_nerve_tests')
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
          .from('cranial_nerve_tests')
          .insert([{
            ...updates,
            appointment_id: appointmentId,
            nerve_id: nerveId,
            user_id: userData.user.id
          }])
          .select()
          .single();

        if (error) throw error;
        setTests(prev => [...prev, data]);
      }
    } catch (err) {
      console.error("Error updating cranial nerve test:", err);
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
