
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppointmentWithClient } from "@/types/crm";
import { showError } from "@/utils/toast";
import { safeParse, safeStringify } from "@/utils/safe-json";
import { DEMO_APPOINTMENT_ID, demoAppointment, demoHistory } from "@/data/demo-session";

/** Metadata arrives as jsonb (object) or, from older rows, a JSON string. */
const normalizeMetadata = (value: unknown): Record<string, unknown> => {
  if (!value) return {};
  if (typeof value === "string") return safeParse(value, {});
  return typeof value === "object" ? { ...(value as Record<string, unknown>) } : {};
};

export function useAppointment(id: string | undefined) {
  const [appointment, setAppointment] = useState<AppointmentWithClient | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  /** `/appointments/demo` renders the real page against an in-memory fixture. */
  const isDemo = id === DEMO_APPOINTMENT_ID;
  
  // Use a ref to track the latest pattern to prevent race conditions during rapid updates
  const latestPatternRef = useRef<any>(null);
  // Same idea for metadata: every writer merges against this instead of the
  // (possibly stale) copy on the appointment object.
  const latestMetadataRef = useRef<Record<string, unknown>>({});

  const fetchData = useCallback(async () => {
    if (!id) return;

    if (isDemo) {
      const app = demoAppointment();
      setAppointment(app);
      latestPatternRef.current = safeParse(app.priority_pattern, {});
      latestMetadataRef.current = normalizeMetadata(app.metadata);
      setHistory(demoHistory());
      setLoading(false);
      return;
    }

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
            is_practitioner,
            standard_rate,
            medical_history
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
      latestMetadataRef.current = normalizeMetadata(app.metadata);

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
  }, [id, isDemo]);

  const saveField = useCallback(async (field: string, value: any) => {
    if (!id || !appointment) return;
    
    const normalized = Array.isArray(value) 
      ? value 
      : (typeof value === 'string' ? (value.trim() === '' ? null : value.trim()) : value);

    if (isDemo) {
      setAppointment(prev => prev ? { ...prev, [field]: normalized } as AppointmentWithClient : null);
      if (field === 'priority_pattern') {
        latestPatternRef.current = safeParse(normalized, {});
      }
      if (field === 'metadata') {
        latestMetadataRef.current = normalizeMetadata(normalized);
      }
      return;
    }

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
      if (field === 'metadata') {
        latestMetadataRef.current = normalizeMetadata(normalized);
      }
    } catch (err: any) {
      console.error(`Save failed for ${field}:`, err);
      showError(`Failed to save ${field}`);
      throw err;
    }
  }, [id, appointment, isDemo]);

  /**
   * Merge-safe metadata write. The updater receives the freshest metadata
   * (tracked in a ref, so back-to-back writes in the same tick can't clobber
   * each other) and returns the next object.
   */
  const updateMetadata = useCallback(async (
    updater: (current: Record<string, unknown>) => Record<string, unknown>
  ) => {
    if (!id) return null;

    const next = updater({ ...latestMetadataRef.current });
    latestMetadataRef.current = next;

    // Optimistic: the UI (and the next updater) sees it immediately.
    setAppointment(prev => prev ? { ...prev, metadata: next } as AppointmentWithClient : null);

    if (isDemo) return next;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ metadata: next })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to persist metadata:", err);
      showError("Failed to save correction log");
    }

    return next;
  }, [id, isDemo]);

  const updatePriorityPattern = useCallback(async (category: string, itemName: string, status: string | null, side?: 'L' | 'R') => {
    if (!id || !appointment) return null;

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
    
    if (isDemo) return currentPattern;

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

    return currentPattern; // Return the updated pattern object synchronously to prevent race conditions
  }, [id, appointment, isDemo]);

  useEffect(() => {
    fetchData();

    if (!id || isDemo) return;

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
          if (updatedData.metadata !== undefined) {
            latestMetadataRef.current = normalizeMetadata(updatedData.metadata);
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
  }, [id, fetchData, isDemo]);

  return { 
    appointment, 
    history, 
    loading, 
    saveField, 
    updatePriorityPattern,
    updateMetadata,
    // Demo edits live in state; re-fetching would reset them to the fixture.
    refresh: isDemo ? async () => {} : fetchData 
  };
}