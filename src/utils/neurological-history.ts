"use client";

import { format } from "date-fns";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { safeParse } from "./safe-json";

export interface FindingHistory {
  name: string;
  category: string;
  history: {
    date: string;
    appointmentId: string;
    status: string;
    correction?: string | null;
  }[];
  firstInhibited?: string;
  lastCleared?: string;
  isResolved: boolean;
}

const DYSFUNCTIONAL_STATUSES = ['Inhibited', 'Hypertonic', 'Switching', 'Inhibition'];
const CLEAR_STATUSES = ['Clear', 'Normotonic'];

const arabicToRoman: Record<string, string> = {
  '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V', '6': 'VI',
  '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X', '11': 'XI', '12': 'XII'
};

/**
 * Normalizes messy IDs or short names into proper clinical display names.
 */
const getCanonicalName = (name: string): string => {
  // Recursively strip any (L), (R), or (Bilateral) suffixes
  let clean = name
    .replace(/\s*\([LR]\)/gi, '')
    .replace(/\s*\(Bilateral\)/gi, '')
    .trim();
  
  // Normalize Arabic CN numbers (e.g., CN 10 -> CN X, CN 1 -> CN I)
  const cnMatch = clean.match(/^CN\s+(\d+)(?:\s*:\s*(.+))?$/i);
  if (cnMatch) {
    const num = cnMatch[1];
    const roman = arabicToRoman[num];
    if (roman) {
      const nerve = CRANIAL_NERVES.find(n => n.id.toString() === num);
      if (nerve) {
        return `${nerve.name}: ${nerve.latinName}`;
      }
    }
  }

  // Normalize Roman CN numbers (e.g., CN I -> CN I: Olfactory)
  const cnRomanMatch = clean.match(/^CN\s+([IVXLCDM]+)(?:\s*:\s*(.+))?$/i);
  if (cnRomanMatch) {
    const roman = cnRomanMatch[1].toUpperCase();
    const nerve = CRANIAL_NERVES.find(n => n.name === `CN ${roman}`);
    if (nerve) {
      return `${nerve.name}: ${nerve.latinName}`;
    }
  }

  // Check Primitive Reflexes
  const lowerClean = clean.toLowerCase();
  const reflex = PRIMITIVE_REFLEXES.find(r => 
    r.id.toLowerCase() === lowerClean || 
    r.name.toLowerCase() === lowerClean ||
    r.name.toLowerCase().includes(lowerClean)
  );
  if (reflex) return reflex.name;

  // Check Brain Points
  const point = BRAIN_REFLEX_POINTS.find(p => 
    p.id.toLowerCase() === lowerClean || 
    p.name.toLowerCase() === lowerClean ||
    p.name.toLowerCase().split(':')[0].trim() === lowerClean
  );
  if (point) return point.name.split(':')[0].trim();

  return clean;
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

      // 1. Normalize all items in this category first
      const sessionItems: { base: string, side: string, status: string }[] = [];
      Object.entries(items).forEach(([key, status]) => {
        const strStatus = status as string;
        const isCleared = strStatus.endsWith('_Cleared');
        const baseStatus = strStatus.replace('_Cleared', '');
        
        const sideMatch = key.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] : "";
        const base = getCanonicalName(key);
        sessionItems.push({ base, side, status: strStatus });
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
          status: item.status,
          correction: app.modes_balances || app.notes || null
        });
      });
    });
  });

  // Post-process findingsMap to merge non-lateralized entries if lateralized ones exist for the same base name
  const keys = Object.keys(findingsMap);
  keys.forEach(key => {
    const finding = findingsMap[key];
    // If this is a non-lateralized finding (doesn't end with (L) or (R))
    if (!finding.name.endsWith('(L)') && !finding.name.endsWith('(R)')) {
      const categoryKey = key.split('-')[0];
      const hasLeft = keys.includes(`${categoryKey}-${finding.name} (L)`);
      const hasRight = keys.includes(`${categoryKey}-${finding.name} (R)`);
      
      if (hasLeft || hasRight) {
        // Merge history of non-lateralized entry into the lateralized ones
        if (hasLeft) {
          findingsMap[`${categoryKey}-${finding.name} (L)`].history.push(...finding.history);
          findingsMap[`${categoryKey}-${finding.name} (L)`].history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }
        if (hasRight) {
          findingsMap[`${categoryKey}-${finding.name} (R)`].history.push(...finding.history);
          findingsMap[`${categoryKey}-${finding.name} (R)`].history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }
        delete findingsMap[key];
      }
    }
  });

  // Calculate resolutions
  return Object.values(findingsMap).map(finding => {
    const inhibitedDates = finding.history.filter(h => DYSFUNCTIONAL_STATUSES.includes(h.status.replace('_Cleared', '')));
    
    if (inhibitedDates.length > 0) {
      finding.firstInhibited = inhibitedDates[0].date;
    }
    
    // It's resolved if the LATEST test was 'Clear' or 'Normotonic'
    const latestTest = finding.history[finding.history.length - 1];
    if (latestTest && (CLEAR_STATUSES.includes(latestTest.status) || latestTest.status.endsWith('_Cleared'))) {
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