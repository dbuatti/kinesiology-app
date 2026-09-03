import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface IcloudCalendarEvent {
  id: string;
  summary: string | null;
  start: string | null;
  end: string | null;
  allDay: boolean;
  location: string | null;
  transparent: boolean;
  source: "icloud";
}

interface IcloudResponse {
  status?: string;
  message?: string;
  items?: IcloudCalendarEvent[];
  total?: number;
}

/**
 * Fetches the practitioner's iCloud calendar events over [startISO, endISO]
 * via the icloud-calendar-read edge function. This is the authoritative busy
 * source (teaching, appointments, FNH, voice). Unlike Google, no OAuth scope
 * is needed — it reads the published webcal feed directly.
 */
export function useIcloudCalendar(startISO: string, endISO: string) {
  const [events, setEvents] = useState<IcloudCalendarEvent[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTotal(0);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<IcloudResponse>(
        "icloud-calendar-read",
        {
          body: {
            start: startISO,
            end: endISO,
          },
        }
      );
      if (invokeError) throw invokeError;

      if (!data || data.status === "error") {
        setError(data?.message || "Could not load iCloud calendar.");
        setEvents([]);
        return;
      }

      setEvents(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load iCloud calendar:", err);
      setError(err instanceof Error ? err.message : "Could not load iCloud calendar.");
    } finally {
      setLoading(false);
    }
  }, [startISO, endISO]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, total, loading, error, refetch: fetchEvents };
}
