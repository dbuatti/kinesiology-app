import { supabase } from "@/integrations/supabase/client";

export type MasteryCategory = 'Muscles' | 'Reflexes' | 'Brain Zones' | 'Techniques';

export interface MasteryStat {
  id: string;
  name: string;
  category: MasteryCategory;
  count: number;
  dysfunctionCount: number;
  dysfunctionRate: number;
  lastLogged: string | null;
  masteryLevel: 'Novice' | 'Competent' | 'Proficient' | 'Master';
}

export async function fetchMasteryStats(): Promise<MasteryStat[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. Fetch all muscle tests
  const { data: muscleTests } = await supabase
    .from('muscle_tests')
    .select('muscle_name, status, created_at');

  // 2. Fetch all appointments for reflexes and techniques
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      date, 
      priority_pattern, 
      harmonic_rocking_notes, 
      t1_reset_notes, 
      diaphragm_reset_notes, 
      vagus_nerve_notes, 
      gait_notes, 
      lymphatic_notes
    `);

  const statsMap: Record<string, Partial<MasteryStat>> = {};

  const getLevel = (count: number): MasteryStat['masteryLevel'] => {
    if (count >= 11) return 'Master';
    if (count >= 6) return 'Proficient';
    if (count >= 3) return 'Competent';
    return 'Novice';
  };

  // Process Muscles
  muscleTests?.forEach(test => {
    const name = test.muscle_name.replace(/ \([LR]\)$/, '');
    if (!statsMap[name]) {
      statsMap[name] = { id: name, name, category: 'Muscles', count: 0, dysfunctionCount: 0, lastLogged: null };
    }
    statsMap[name].count!++;
    if (test.status !== 'Normotonic') statsMap[name].dysfunctionCount!++;
    if (!statsMap[name].lastLogged || new Date(test.created_at) > new Date(statsMap[name].lastLogged!)) {
      statsMap[name].lastLogged = test.created_at;
    }
  });

  // Process Reflexes and Brain Zones from priority_pattern
  appointments?.forEach(app => {
    if (app.priority_pattern) {
      try {
        const pattern = JSON.parse(app.priority_pattern);
        Object.entries(pattern).forEach(([catKey, items]: [string, any]) => {
          const category: MasteryCategory = catKey === 'primitiveReflexes' ? 'Reflexes' : 'Brain Zones';
          
          Object.entries(items).forEach(([name, status]) => {
            const cleanName = name.replace(/ \([LR]\)$/, '');
            if (!statsMap[cleanName]) {
              statsMap[cleanName] = { id: cleanName, name: cleanName, category, count: 0, dysfunctionCount: 0, lastLogged: null };
            }
            statsMap[cleanName].count!++;
            if (status === 'Inhibited') statsMap[cleanName].dysfunctionCount!++;
            if (!statsMap[cleanName].lastLogged || new Date(app.date) > new Date(statsMap[cleanName].lastLogged!)) {
              statsMap[cleanName].lastLogged = app.date;
            }
          });
        });
      } catch (e) {
        console.error("Error parsing pattern for stats", e);
      }
    }

    // Process Techniques
    const techniques = [
      { key: 'harmonic_rocking_notes', name: 'Harmonic Rocking' },
      { key: 't1_reset_notes', name: 'T1 Sympathetic Reset' },
      { key: 'diaphragm_reset_notes', name: 'Diaphragm Reset' },
      { key: 'vagus_nerve_notes', name: 'Vagus Nerve Protocol' },
      { key: 'gait_notes', name: 'Gait Integration' },
      { key: 'lymphatic_notes', name: 'Lymphatic Drainage' }
    ];

    techniques.forEach(tech => {
      if ((app as any)[tech.key]) {
        if (!statsMap[tech.name]) {
          statsMap[tech.name] = { id: tech.name, name: tech.name, category: 'Techniques', count: 0, dysfunctionCount: 0, lastLogged: null };
        }
        statsMap[tech.name].count!++;
        if (!statsMap[tech.name].lastLogged || new Date(app.date) > new Date(statsMap[tech.name].lastLogged!)) {
          statsMap[tech.name].lastLogged = app.date;
        }
      }
    });
  });

  return Object.values(statsMap).map(s => ({
    ...s,
    dysfunctionRate: s.count! > 0 ? Math.round((s.dysfunctionCount! / s.count!) * 100) : 0,
    masteryLevel: getLevel(s.count!)
  } as MasteryStat)).sort((a, b) => b.count - a.count);
}