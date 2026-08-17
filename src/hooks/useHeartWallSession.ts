
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HeartWallSession, HeartWallLayer, HeartWallLayerStatus } from "@/types/crm";
import { showError } from "@/utils/toast";

interface Row {
  id: string;
  user_id: string;
  client_id: string;
  appointment_id: string | null;
  status: string;
  initial_layer_count: number | null;
  layers_remaining: number | null;
  is_hidden: boolean;
  layers: HeartWallLayer[];
  notes: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToSession(r: Row): HeartWallSession {
  return {
    id: r.id,
    clientId: r.client_id,
    appointmentId: r.appointment_id,
    status: r.status as HeartWallSession["status"],
    initialLayerCount: r.initial_layer_count,
    layersRemaining: r.layers_remaining,
    isHidden: r.is_hidden,
    layers: r.layers || [],
    notes: r.notes,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    createdAt: r.created_at,
  };
}

export function useHeartWallSession(clientId: string | null, appointmentId?: string | null) {
  const [session, setSession] = useState<HeartWallSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }

    try {
      const query = supabase
        .from("heart_wall_sessions")
        .select("*")
        .eq("client_id", clientId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(1);

      const { data, error } = await query.single();
      if (error && error.code !== "PGRST116") throw error;
      setSession(data ? rowToSession(data as unknown as Row) : null);
    } catch (err) {
      console.error("Error fetching heart wall session:", err);
      showError("Failed to load heart wall data.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  const createSession = useCallback(async (initialLayers: number | null = null) => {
    if (!clientId) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const layers: HeartWallLayer[] = [];

    const { data, error } = await supabase
      .from("heart_wall_sessions")
      .insert({
        user_id: userData.user.id,
        client_id: clientId,
        appointment_id: appointmentId || null,
        status: "in-progress",
        initial_layer_count: initialLayers,
        layers_remaining: initialLayers,
        is_hidden: false,
        layers: layers as unknown as Record<string, unknown>[],
      })
      .select()
      .single();

    if (error) throw error;
    const newSession = rowToSession(data as Row);
    setSession(newSession);
    return newSession;
  }, [clientId, appointmentId]);

  const saveSession = useCallback(async (updates: Partial<HeartWallSession>) => {
    if (!session) return;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.layers !== undefined) dbUpdates.layers = updates.layers;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.initialLayerCount !== undefined) dbUpdates.initial_layer_count = updates.initialLayerCount;
    if (updates.layersRemaining !== undefined) dbUpdates.layers_remaining = updates.layersRemaining;
    if (updates.isHidden !== undefined) dbUpdates.is_hidden = updates.isHidden;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("heart_wall_sessions")
      .update(dbUpdates)
      .eq("id", session.id);

    if (error) throw error;

    setSession(prev => prev ? { ...prev, ...updates } : prev);
  }, [session]);

  const archiveSession = useCallback(async () => {
    await saveSession({ isHidden: true });
  }, [saveSession]);

  return {
    session,
    loading,
    createSession,
    saveSession,
    archiveSession,
    refresh: fetchSession,
  };
}
