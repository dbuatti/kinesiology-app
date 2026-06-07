import React from 'react';
// @ts-ignore
import sidebarRaw from '../../components/crm/document-view/DocumentRightSidebar.tsx?raw';
// @ts-ignore
import appointmentRaw from '../AppointmentDetailPage.tsx?raw';

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 bg-slate-900 text-slate-100 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold mb-2 text-amber-400">DocumentRightSidebar.tsx</h1>
        <pre className="bg-slate-950 p-4 rounded-lg overflow-auto max-h-[400px] text-xs font-mono whitespace-pre-wrap border border-slate-800">
          {sidebarRaw}
        </pre>
      </div>
      <div>
        <h1 className="text-2xl font-bold mb-2 text-amber-400">AppointmentDetailPage.tsx</h1>
        <pre className="bg-slate-950 p-4 rounded-lg overflow-auto max-h-[400px] text-xs font-mono whitespace-pre-wrap border border-slate-800">
          {appointmentRaw}
        </pre>
      </div>
    </div>
  );
}