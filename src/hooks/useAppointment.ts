"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppointmentWithClient } from "@/types/crm";
import { showError } from "@/utils/toast";
import { safeParse, safeStringify } from "@/utils/safe-json";

export function useAppointment(id: string | undefined) {
  const [appointment, setAppointment] = useState<AppointmentWithClient | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use a ref to track the latest pattern to prevent race conditions during rapid updates
  const latestPatternRef = useRef<any>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (
            id,
            name,
            born,
            journal,
            email,
            phone,
            is_practitioner
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const app = {
        ...data,
        date: new Date(data.date),
      } as unknown as AppointmentWithClient;

      setAppointment(app);
      latestPatternRef.current = safeParse(app.priority_pattern, {});

      // Fetch client history
      const { data: historyData } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', app.clients.id)
        .order('date', { ascending: false });
      
      setHistory((historyData || []).map(h => ({ ...h, date: new Date(h.date) })));

    } catch (err) {
      console.error("Error fetching appointment:", err);
      showError("Failed to load appointment details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const saveField = useCallback(async (field: string, value: any) => {
    if (!id || !appointment) return;
    
    const normalized = Array.isArray(value) 
      ? value 
      : (typeof value === 'string' ? (value.trim() === '' ? null : value.trim()) : value);

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ [field]: normalized })
        .eq('id', id);

      if (error) throw error;
      
      setAppointment(prev => prev ? { ...prev, [field]: normalized } as AppointmentWithClient : null);
      
      if (field === 'priority_pattern') {
        latestPatternRef.current = safeParse(normalized, {});
      }
    } catch (err: any) {
      console.error(`Save failed for ${field}:`, err);
      showError(`Failed to save ${field}`);
      throw err;
    }
  }, [id, appointment]);

  const updatePriorityPattern = useCallback(async (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => {
    if (!id || !appointment) return;

    // Always work off the latest ref to avoid overwriting parallel updates
    const currentPattern = { ...latestPatternRef.current };
    
    if (!currentPattern[category]) {
      currentPattern[category] = {};
    }

    const finalItemName = side ? `${itemName} (${side})` : itemName;

    if (status === null) {
      delete currentPattern[category][finalItemName];
    } else {
      currentPattern[category][finalItemName] = status;
    }

    const newJson = safeStringify(currentPattern);
    latestPatternRef.current = currentPattern; // Update ref immediately
    
    // Update local state immediately for UI responsiveness
    setAppointment(prev => prev ? { ...prev, priority_pattern: newJson } as AppointmentWithClient : null);
    
    // Persist to DB
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ priority_pattern: newJson })
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to persist pattern update:", e);
    }
  }, [id, appointment]);

  useEffect(() => {
    fetchData();

    if (!id) return;

    const channel = supabase
      .channel(`appointment-updates-${id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'appointments', 
        filter: `id=eq.${id}` 
      }, (payload) => {
        setAppointment((prev) => {
          if (!prev) return prev;
          const updatedData = { ...payload.new };
          
          // If the update came from elsewhere, sync our ref
          if (updatedData.priority_pattern) {
            latestPatternRef.current = safeParse(updatedData.priority_pattern, {});
          }

          if (updatedData.date && typeof updatedData.date === 'string') {
            updatedData.date = new Date(updatedData.date);
          }
          return { ...prev, ...updatedData } as AppointmentWithClient;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, fetchData]);

  return { 
    appointment, 
    history, 
    loading, 
    saveField, 
    updatePriorityPattern,
    refresh: fetchData 
  };
}