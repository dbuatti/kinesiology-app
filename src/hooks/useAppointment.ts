"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppointmentWithClient } from "@/types/crm";
import { showError } from "@/utils/toast";
import { safeParse, safeStringify } from "@/utils/safe-json";

export function useAppointment(id: string | undefined) {
  const [appointment, setAppointment] = useState<AppointmentWithClient | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const saveField = async (field: string, value: any) => {
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
    } catch (err: any) {
      console.error(`Save failed for ${field}:`, err);
      showError(`Failed to save ${field}`);
      throw err;
    }
  };

  const updatePriorityPattern = async (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null) => {
    if (!id || !appointment) return;

    const currentPattern = safeParse(appointment.priority_pattern, {} as any);
    
    if (!currentPattern[category]) {
      currentPattern[category] = {};
    }

    if (status === null) {
      delete currentPattern[category][itemName];
    } else {
      currentPattern[category][itemName] = status;
    }

    const newJson = safeStringify(currentPattern);
    await saveField('priority_pattern', newJson);
  };

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