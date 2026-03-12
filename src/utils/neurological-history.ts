"use client";

import { format } from "date-fns";

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

export function processNeurologicalHistory(appointments: any[]): FindingHistory[] {
  const findingsMap: Record<string, FindingHistory> = {};
  
  // Sort appointments by date ascending to track progression
  const sortedApps = [...appointments].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedApps.forEach(app => {
    if (!app.priority_pattern) return;

    try {
      const pattern = JSON.parse(app.priority_pattern);
      const dateStr = format(new Date(app.date), "MMM d, yyyy");

      Object.entries(pattern).forEach(([category, items]: [string, any]) => {
        Object.entries(items).forEach(([name, status]: [string, any]) => {
          const key = `${category}-${name}`;
          
          if (!findingsMap[key]) {
            findingsMap[key] = {
              name,
              category: category.replace(/([A-Z])/g, ' $1').trim(), // camelCase to Title Case
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
    const clearDates = finding.history.filter(h => h.status === 'Clear');
    
    if (inhibitedDates.length > 0) {
      finding.firstInhibited = inhibitedDates[0].date;
      
      // It's resolved if the LATEST test was 'Clear'
      const latestTest = finding.history[finding.history.length - 1];
      if (latestTest.status === 'Clear') {
        finding.isResolved = true;
        finding.lastCleared = latestTest.date;
      }
    }

    return finding;
  }).sort((a, b) => {
    // Sort by category then name
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });
}