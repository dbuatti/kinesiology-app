import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GoogleCalendarEvent {
  id: string;
  summary: string | null;
  start: string | null;
  end: string | null;
  allDay: boolean;
  location: string | null;
  transparent: boolean;
}

interface CalendarResponse {
  status?: string;
  message?: string;
  scopeError?: "auth" | "scope" | "api";
  timeZone?: string;
  items?: GoogleCalendarEvent[];
  total?: number;
  sample?: { summary: string; start: unknown; end: unknown }[];
}

/**
 * Fetches the practitioner's Google Calendar events over [startISO, endISO].
 * Surfaces whether the token lacks calendar scope so the UI can show a gentle
 * hint rather than a hard failure.
 */
export function useGoogleCalendar(startISO: string, endISO: string) {
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    setScopeError(null);
    setTotal(0);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<CalendarResponse>(
        "google-calendar-read",
        {
          body: {
            start: startISO,
            end: endISO,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }
      );
      if (invokeError) throw invokeError;

      if (!data || data.status === "error") {
        if (data?.scopeError === "scope" || data?.scopeError === "auth") {
          setScopeError(data.message || "Google Calendar is not available.");
          setEvents([]);
          return;
        }
        setError(data?.message || "Could not load Google Calendar.");
        setEvents([]);
        return;
      }

      setEvents(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load Google Calendar:", err);
      setError(err instanceof Error ? err.message : "Could not load Google Calendar.");
    } finally {
      setLoading(false);
    }
  }, [startISO, endISO, enabled]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, total, loading, error, scopeError, refetch: fetchEvents };
}
