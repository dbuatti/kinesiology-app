"use client";

import { format } from "date-fns";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";
import { safeParse } from "./safe-json";

export interface FindingHistory {
  name: string;
  category: string;
  history: {
    date: string;
    appointmentId: string;
    status: 'Clear' | 'Inhibited' | 'Not Tested';
  }[];
  firstInhibited?: string;
  lastCleared?: string;
  isResolved: boolean;
}

/**
 * Normalizes messy IDs or short names into proper clinical display names.
 */
const getCanonicalName = (name: string): string => {
  const cleanName = name.replace(/ \([LR]\)$/, '').trim().toLowerCase();
  
  // Check Primitive Reflexes
  const reflex = PRIMITIVE_REFLEXES.find(r => 
    r.id.toLowerCase() === cleanName || 
    r.name.toLowerCase() === cleanName ||
    r.name.toLowerCase().includes(cleanName)
  );
  if (reflex) return reflex.name;

  // Check Brain Points
  const point = BRAIN_REFLEX_POINTS.find(p => 
    p.id.toLowerCase() === cleanName || 
    p.name.toLowerCase() === cleanName ||
    p.name.toLowerCase().split(':')[0].trim() === cleanName
  );
  if (point) return point.name.split(':')[0].trim();

  return name;
};

export function processNeurologicalHistory(appointments: any[]): FindingHistory[] {
  const findingsMap: Record<string, FindingHistory> = {};
  
  // Sort appointments by date ascending to track progression
  const sortedApps = [...appointments].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedApps.forEach(app => {
    if (!app.priority_pattern) return;

    const pattern = safeParse(app.priority_pattern, {} as Record<string, Record<string, string>>);
    const dateStr = format(new Date(app.date), "MMM d, yyyy");

    Object.entries(pattern).forEach(([category, items]) => {
      if (!items || typeof items !== 'object') return;

      // 1. Normalize all items in this category for this session first
      const sessionItems: { base: string, side: string, status: string }[] = [];
      Object.entries(items).forEach(([key, status]) => {
        const sideMatch = key.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] : "";
        const base = getCanonicalName(key);
        sessionItems.push({ base, side, status });
      });

      // 2. Filter out base items if lateralized ones exist for the same base name
      const filteredSessionItems = sessionItems.filter(item => {
        if (item.side === "") {
          const hasLateral = sessionItems.some(other => other.base === item.base && other.side !== "");
          if (hasLateral) return false;
        }
        return true;
      });

      // 3. Add to global map
      filteredSessionItems.forEach(item => {
        const displayName = item.side ? `${item.base} (${item.side})` : item.base;
        const catDisplay = category
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();

        const key = `${category}-${displayName}`;
        
        if (!findingsMap[key]) {
          findingsMap[key] = {
            name: displayName,
            category: catDisplay,
            history: [],
            isResolved: false
          };
        }

        findingsMap[key].history.push({
          date: dateStr,
          appointmentId: app.id,
          status: item.status as 'Clear' | 'Inhibited'
        });
      });
    });
  });

  // Calculate resolutions
  return Object.values(findingsMap).map(finding => {
    const inhibitedDates = finding.history.filter(h => h.status === 'Inhibited');
    
    if (inhibitedDates.length > 0) {
      finding.firstInhibited = inhibitedDates[0].date;
    }
    
    // It's resolved if the LATEST test was 'Clear'
    const latestTest = finding.history[finding.history.length - 1];
    if (latestTest && latestTest.status === 'Clear') {
      finding.isResolved = true;
      finding.lastCleared = latestTest.date;
    }

    return finding;
  }).sort((a, b) => {
    // Sort by category then name
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });
}