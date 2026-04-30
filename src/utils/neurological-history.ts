"use client";

import { format } from "date-fns";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";

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

    try {
      const pattern = typeof app.priority_pattern === 'string' 
        ? JSON.parse(app.priority_pattern) 
        : app.priority_pattern;
        
      const dateStr = format(new Date(app.date), "MMM d, yyyy");

      Object.entries(pattern).forEach(([category, items]: [string, any]) => {
        if (!items || typeof items !== 'object') return;

        // Track what we've seen in THIS session to prevent internal duplicates
        const seenInSession = new Set<string>();

        Object.entries(items).forEach(([rawName, status]: [string, any]) => {
          const sideMatch = rawName.match(/\(([LR])\)$/);
          const side = sideMatch ? ` (${sideMatch[1]})` : "";
          const baseName = getCanonicalName(rawName);
          const displayName = `${baseName}${side}`;
          
          // If we have a lateralized version (L or R), ignore the "base" version in the same session
          if (!side) {
            const hasLateralized = Object.keys(items).some(k => k.startsWith(rawName) && k.includes('('));
            if (hasLateralized) return;
          }

          if (seenInSession.has(displayName)) return;
          seenInSession.add(displayName);

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
            status: status as 'Clear' | 'Inhibited'
          });
        });
      });
    } catch (e) {
      console.error("Error parsing priority pattern for history", e);
    }
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