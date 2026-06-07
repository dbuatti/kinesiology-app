import React from 'react';
// @ts-ignore
import sidebarRaw from '../../components/crm/document-view/DocumentRightSidebar.tsx?raw';
// @ts-ignore
import appointmentRaw from '../AppointmentDetailPage.tsx?raw';

function getSurroundingLines(text: string, query: string, linesBefore = 5, linesAfter = 5) {
  const lines = text.split('\n');
  const results: string[] = [];
  lines.forEach((line, index) => {
    if (line.includes(query)) {
      const start = Math.max(0, index - linesBefore);
      const end = Math.min(lines.length, index + linesAfter + 1);
      results.push(
        `--- Match at line ${index + 1} ---\n` +
        lines.slice(start, end).map((l, i) => `${start + i + 1}: ${l}`).join('\n')
      );
    }
  });
  return results.join('\n\n');
}

export default function DashboardPage() {
  const sidebarMatches = getSurroundingLines(sidebarRaw, 'currentPeakMeridian');
  const appointmentMatches = getSurroundingLines(appointmentRaw, 'currentPeakMeridian');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 bg-slate-900 text-slate-100 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold mb-2 text-amber-400">DocumentRightSidebar.tsx Matches</h1>
        <pre className="bg-slate-950 p-4 rounded-lg overflow-auto max-h-[400px] text-xs font-mono whitespace-pre-wrap border border-slate-800">
          {sidebarMatches || 'No matches found'}
        </pre>
      </div>
      <div>
        <h1 className="text-2xl font-bold mb-2 text-amber-400">AppointmentDetailPage.tsx Matches</h1>
        <pre className="bg-slate-950 p-4 rounded-lg overflow-auto max-h-[400px] text-xs font-mono whitespace-pre-wrap border border-slate-800">
          {appointmentMatches || 'No matches found'}
        </pre>
      </div>
    </div>
  );
}