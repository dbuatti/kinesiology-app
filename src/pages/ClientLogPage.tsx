import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ClientLogView, { type LogClientSummary } from "@/components/crm/ClientLogView";
import { buildSessionLog, type MuscleTestRow, type SessionLog } from "@/lib/client-log";
import type { Appointment } from "@/types/crm";

export default function ClientLogPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<LogClientSummary | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [muscleTests, setMuscleTests] = useState<MuscleTestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const [clientResult, appointmentResult] = await Promise.all([
        supabase.from("clients").select("id, name, practices").eq("id", id).maybeSingle(),
        supabase.from("appointments").select("*").eq("client_id", id).order("date", { ascending: false }),
      ]);

      if (cancelled) return;

      if (clientResult.error || !clientResult.data) {
        setError("Client not found.");
        setLoading(false);
        return;
      }
      if (appointmentResult.error) {
        setError("Couldn't load the appointment log.");
        setLoading(false);
        return;
      }

      const rows = ((appointmentResult.data || []) as Array<Record<string, unknown>>)
        .map((row) => ({ ...row, date: new Date(String(row.date)) }))
        .filter((row) => !Number.isNaN((row.date as Date).getTime())) as unknown as Appointment[];

      setClient(clientResult.data as LogClientSummary);
      setAppointments(rows);

      // Muscle tests can hold a finding that never reached the priority pattern.
      const appointmentIds = rows.map((row) => row.id).filter(Boolean);
      if (appointmentIds.length > 0) {
        const { data: tests } = await supabase
          .from("muscle_tests")
          .select("id, appointment_id, muscle_name, status")
          .in("appointment_id", appointmentIds);
        if (!cancelled) setMuscleTests((tests || []) as MuscleTestRow[]);
      }

      if (!cancelled) setLoading(false);
    })().catch(() => {
      if (!cancelled) {
        setError("Couldn't load the appointment log.");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Newest first — oldest at the bottom.
  const sessions = useMemo<SessionLog[]>(
    () =>
      [...appointments]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map((appointment) => buildSessionLog(appointment, muscleTests)),
    [appointments, muscleTests],
  );

  return <ClientLogView client={client} sessions={sessions} loading={loading} error={error} />;
}