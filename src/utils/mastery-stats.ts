import { supabase } from "@/integrations/supabase/client";
import { MUSCLE_GROUPS } from "@/data/muscle-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";

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

const TECHNIQUES = [
  { key: 'harmonic_rocking_notes', name: 'Harmonic Rocking' },
  { key: 't1_reset_notes', name: 'T1 Sympathetic Reset' },
  { key: 'diaphragm_reset_notes', name: 'Diaphragm Reset' },
  { key: 'vagus_nerve_notes', name: 'Vagus Nerve Protocol' },
  { key: 'gait_notes', name: 'Gait Integration' },
  { key: 'lymphatic_notes', name: 'Lymphatic Drainage' }
];

export async function fetchMasteryStats(): Promise<MasteryStat[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const statsMap: Record<string, MasteryStat> = {};

  const getLevel = (count: number): MasteryStat['masteryLevel'] => {
    if (count >= 11) return 'Master';
    if (count >= 6) return 'Proficient';
    if (count >= 3) return 'Competent';
    return 'Novice';
  };

  // 1. Pre-populate with ALL possible items
  Object.values(MUSCLE_GROUPS).flat().forEach(name => {
    statsMap[name] = {
      id: name, name, category: 'Muscles', count: 0, dysfunctionCount: 0, dysfunctionRate: 0, lastLogged: null, masteryLevel: 'Novice'
    };
  });

  PRIMITIVE_REFLEXES.forEach(reflex => {
    statsMap[reflex.name] = {
      id: reflex.name, name: reflex.name, category: 'Reflexes', count: 0, dysfunctionCount: 0, dysfunctionRate: 0, lastLogged: null, masteryLevel: 'Novice'
    };
  });

  BRAIN_REFLEX_POINTS.forEach(point => {
    const name = point.name.includes(':') ? point.name.split(':')[0].trim() : point.name;
    statsMap[name] = {
      id: name, name, category: 'Brain Zones', count: 0, dysfunctionCount: 0, dysfunctionRate: 0, lastLogged: null, masteryLevel: 'Novice'
    };
  });

  TECHNIQUES.forEach(tech => {
    statsMap[tech.name] = {
      id: tech.name, name: tech.name, category: 'Techniques', count: 0, dysfunctionCount: 0, dysfunctionRate: 0, lastLogged: null, masteryLevel: 'Novice'
    };
  });

  // 2. Fetch user-specific logs
  const [muscleRes, appRes] = await Promise.all([
    supabase.from('muscle_tests').select('muscle_name, status, created_at').eq('user_id', user.id),
    supabase.from('appointments').select('date, priority_pattern, harmonic_rocking_notes, t1_reset_notes, diaphragm_reset_notes, vagus_nerve_notes, gait_notes, lymphatic_notes').eq('user_id', user.id)
  ]);

  // Process Muscle Tests
  muscleRes.data?.forEach(test => {
    const name = test.muscle_name.replace(/ \([LR]\)$/, '');
    if (statsMap[name]) {
      statsMap[name].count++;
      if (test.status !== 'Normotonic') statsMap[name].dysfunctionCount++;
      if (!statsMap[name].lastLogged || new Date(test.created_at) > new Date(statsMap[name].lastLogged!)) {
        statsMap[name].lastLogged = test.created_at;
      }
    }
  });

  // Process Patterns & Techniques
  appRes.data?.forEach(app => {
    if (app.priority_pattern) {
      try {
        const pattern = JSON.parse(app.priority_pattern);
        Object.values(pattern).forEach((items: any) => {
          Object.entries(items).forEach(([name, status]) => {
            const cleanName = name.replace(/ \([LR]\)$/, '');
            const matchKey = Object.keys(statsMap).find(k => cleanName.startsWith(k));
            if (matchKey && statsMap[matchKey]) {
              statsMap[matchKey].count++;
              if (status === 'Inhibited') statsMap[matchKey].dysfunctionCount++;
              if (!statsMap[matchKey].lastLogged || new Date(app.date) > new Date(statsMap[matchKey].lastLogged!)) {
                statsMap[matchKey].lastLogged = app.date;
              }
            }
          });
        });
      } catch (e) {}
    }

    TECHNIQUES.forEach(tech => {
      if ((app as any)[tech.key]) {
        if (statsMap[tech.name]) {
          statsMap[tech.name].count++;
          if (!statsMap[tech.name].lastLogged || new Date(app.date) > new Date(statsMap[tech.name].lastLogged!)) {
            statsMap[tech.name].lastLogged = app.date;
          }
        }
      }
    });
  });

  return Object.values(statsMap).map(s => ({
    ...s,
    dysfunctionRate: s.count > 0 ? Math.round((s.dysfunctionCount / s.count) * 100) : 0,
    masteryLevel: getLevel(s.count)
  })).sort((a, b) => b.count - a.count);
}