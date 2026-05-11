"use client";

import { safeParse } from "./safe-json";

export type Nuclei = 'Midbrain' | 'Pons' | 'Medulla' | 'Cortex';

export interface NucleiStatus {
  name: Nuclei;
  threatLevel: number; // 0-100
  findings: string[];
  toneEffect: 'Flexors' | 'Extensors' | 'None';
}

export const FINDING_TO_NUCLEI: Record<string, { nuclei: Nuclei, tone: 'Flexors' | 'Extensors' | 'None' }> = {
  // Cranial Nerves
  'CN I': { nuclei: 'Cortex', tone: 'None' },
  'CN II': { nuclei: 'Cortex', tone: 'None' },
  'CN III': { nuclei: 'Midbrain', tone: 'Flexors' },
  'CN IV': { nuclei: 'Midbrain', tone: 'Flexors' },
  'CN V': { nuclei: 'Pons', tone: 'Extensors' },
  'CN VI': { nuclei: 'Pons', tone: 'Extensors' },
  'CN VII': { nuclei: 'Pons', tone: 'Extensors' },
  'CN VIII': { nuclei: 'Pons', tone: 'Extensors' },
  'CN IX': { nuclei: 'Medulla', tone: 'Flexors' },
  'CN X': { nuclei: 'Medulla', tone: 'Flexors' },
  'CN XI': { nuclei: 'Medulla', tone: 'Flexors' },
  'CN XII': { nuclei: 'Medulla', tone: 'Flexors' },
  // Common Muscles
  'Psoas': { nuclei: 'Medulla', tone: 'Flexors' },
  'Supraspinatus': { nuclei: 'Pons', tone: 'Extensors' },
  'Upper Trapezius': { nuclei: 'Medulla', tone: 'Flexors' },
  'SCM': { nuclei: 'Medulla', tone: 'Flexors' },
  'Gluteus Medius': { nuclei: 'Pons', tone: 'Extensors' },
  'Latissimus Dorsi': { nuclei: 'Pons', tone: 'Extensors' },
};

export function calculateBrainstemTone(priorityPattern: string | null): NucleiStatus[] {
  const nucleiMap: Record<Nuclei, NucleiStatus> = {
    'Midbrain': { name: 'Midbrain', threatLevel: 0, findings: [], toneEffect: 'Flexors' },
    'Pons': { name: 'Pons', threatLevel: 0, findings: [], toneEffect: 'Extensors' },
    'Medulla': { name: 'Medulla', threatLevel: 0, findings: [], toneEffect: 'Flexors' },
    'Cortex': { name: 'Cortex', threatLevel: 0, findings: [], toneEffect: 'None' },
  };

  if (!priorityPattern) return Object.values(nucleiMap);

  const pattern = safeParse(priorityPattern, {} as Record<string, Record<string, string>>);
  
  Object.values(pattern).forEach((category) => {
    Object.entries(category).forEach(([name, status]) => {
      if (status === 'Inhibited') {
        const mappingKey = Object.keys(FINDING_TO_NUCLEI).find(key => name.startsWith(key));
        const mapping = mappingKey ? FINDING_TO_NUCLEI[mappingKey] : null;
        
        if (mapping) {
          nucleiMap[mapping.nuclei].findings.push(name);
        }
      }
    });
  });

  Object.values(nucleiMap).forEach(n => {
    n.threatLevel = Math.min(n.findings.length * 25, 100);
  });

  return Object.values(nucleiMap);
}