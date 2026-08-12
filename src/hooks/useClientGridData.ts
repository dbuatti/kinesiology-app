import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Appointment, CranialNerveTest, PrimitiveReflexTest } from "@/types/crm";
import { buildCheckedMap } from "@/components/crm/grid-checked";
import { seedMuscleState, type MuscleGridState } from "@/components/crm/muscle-grid-data";
import { gridSummaryMetrics, type GridNucleiMetric, type GridTrackMetric } from "@/components/crm/grid-summary";
import { safeParse } from "@/utils/safe-json";

export interface ClientGridData {
  checked: Record<string, boolean>;
  muscleState: Record<string, MuscleGridState>;
  activeCount: number;
  muscleCount: number;
  tracks: GridTrackMetric[];
  nuclei: GridNucleiMetric[];
}

export function useClientGridData(appointments: Appointment[]) {
  const [gridTests, setGridTests] = useState<{
    reflexes: Record<string, PrimitiveReflexTest[]>;
    nerves: Record<string, CranialNerveTest[]>;
  }>({ reflexes: {}, nerves: {} });

  useEffect(() => {
    if (!appointments.length) return;
    let cancelled = false;
    const ids = appointments.map((a) => a.id);
    (async () => {
      const [refRes, nerveRes] = await Promise.all([
        supabase.from('primitive_reflex_tests').select('*').in('appointment_id', ids),
        supabase.from('cranial_nerve_tests').select('*').in('appointment_id', ids),
      ]);
      if (cancelled) return;
      const reflexes: Record<string, PrimitiveReflexTest[]> = {};
      ((refRes.data || []) as Array<PrimitiveReflexTest & { appointment_id: string }>).forEach((t) => {
        (reflexes[t.appointment_id] ||= []).push(t);
      });
      const nerves: Record<string, CranialNerveTest[]> = {};
      ((nerveRes.data || []) as Array<CranialNerveTest & { appointment_id: string }>).forEach((t) => {
        (nerves[t.appointment_id] ||= []).push(t);
      });
      setGridTests({ reflexes, nerves });
    })();
    return () => { cancelled = true; };
  }, [appointments]);

  const gridFor = useMemo<Record<string, ClientGridData>>(() => {
    const map: Record<string, ClientGridData> = {};
    appointments.forEach((app) => {
      const checked = buildCheckedMap({
        reflexTests: gridTests.reflexes[app.id] || [],
        nerveTests: gridTests.nerves[app.id] || [],
        priorityPattern: app.priority_pattern,
      });
      const muscleState = seedMuscleState(safeParse(app.priority_pattern, {}));
      const muscleCount = Object.keys(muscleState).length;
      const marks = Object.values(checked).filter(Boolean).length;
      map[app.id] = {
        checked,
        muscleState,
        muscleCount,
        ...gridSummaryMetrics(checked),
        activeCount: marks + muscleCount,
      };
    });
    return map;
  }, [appointments, gridTests]);

  return { gridFor };
}
