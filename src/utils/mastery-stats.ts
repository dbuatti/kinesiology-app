import { supabase } from "@/integrations/supabase/client";
import { MUSCLE_GROUPS } from "@/data/muscle-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";
import { getMuscleInfo } from "@/data/muscle-info-data";

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
  videoUrl?: string;
  pageUrl?: string;
}

const TECHNIQUES = [
  { key: 'harmonic_rocking_notes', name: 'Harmonic Rocking', videoUrl: "https://embed-ssl.wistia.com/deliveries/a8c771702cf0998e7caee0f064316544.mp4", pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152099725/posts/2164655471" },
  { key: 't1_reset_notes', name: 'T1 Sympathetic Reset', videoUrl: "https://embed-ssl.wistia.com/deliveries/ac0d803e766ec7535b8b981303df93bcc177c920.mp4", pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152099725/posts/2164655472" },
  { key: 'diaphragm_reset_notes', name: 'Diaphragm Reset', videoUrl: "https://embed-ssl.wistia.com/deliveries/fc38346a4cb0b8fd1fa8cfba2a74102ed3d5a641.mp4", pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152099725/posts/2164663189" },
  { key: 'vagus_nerve_notes', name: 'Vagus Nerve Protocol', videoUrl: "https://embed-ssl.wistia.com/deliveries/fde31242dde2c7536f59b7c3a46f6070.mp4", pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152152431/posts/2166291753" },
  { key: 'gait_notes', name: 'Gait Integration', videoUrl: "https://embed-ssl.wistia.com/deliveries/14f550f77b125c6afb95ef30dd7bb5cafccc62c1.mp4", pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152099726/posts/2164757718" },
  { key: 'lymphatic_notes', name: 'Lymphatic Drainage', videoUrl: "https://embed-ssl.wistia.com/deliveries/ba06079f4c7f3429554fe6c97a8e8cf0b8e48460.mp4", pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2158539300/posts/2164719983" }
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
    const info = getMuscleInfo(name);
    statsMap[name] = {
      id: name, name, category: 'Muscles', count: 0, dysfunctionCount: 0, dysfunctionRate: 0, lastLogged: null, masteryLevel: 'Novice',
      videoUrl: info.videoUrl,
      pageUrl: info.pageUrl
    };
  });

  PRIMITIVE_REFLEXES.forEach(reflex => {
    statsMap[reflex.name] = {
      id: reflex.name, name: reflex.name, category: 'Reflexes', count: 0, dysfunctionCount: 0, dysfunctionRate: 0, lastLogged: null, masteryLevel: 'Novice',
      videoUrl: reflex.videoUrl,
      pageUrl: reflex.pageUrl
    };
  });

  BRAIN_REFLEX_POINTS.forEach(point => {
    const name = point.name.includes(':') ? point.name.split(':')[0].trim() : point.name;
    statsMap[name] = {
      id: name, 
      name, 
      category: 'Brain Zones', 
      count: 0, 
      dysfunctionCount: 0, 
      dysfunctionRate: 0, 
      lastLogged: null, 
      masteryLevel: 'Novice',
      videoUrl: (point as any).videoUrl,
      pageUrl: (point as any).pageUrl
    };
  });

  TECHNIQUES.forEach(tech => {
    statsMap[tech.name] = {
      id: tech.name, name: tech.name, category: 'Techniques', count: 0, dysfunctionCount: 0, dysfunctionRate: 0, lastLogged: null, masteryLevel: 'Novice',
      videoUrl: tech.videoUrl,
      pageUrl: tech.pageUrl
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