"use client";

import React from 'react';
import { EMOTION_CODE_CHART, ROW_DATA } from '@/data/emotion-code-data';
import { cn } from '@/lib/utils';

const HeartWallPrintable = () => {
  return (
    <div className="bg-white text-black p-8 max-w-[210mm] mx-auto font-serif print:p-0">
      {/* Header */}
      <div className="border-b-4 border-slate-900 pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">Heart Wall Emotions Table</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Clinical Reference • Subconscious Protection Protocol</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resonance Clinical OS</p>
        </div>
      </div>

      {/* The Master Chart */}
      <div className="overflow-hidden border-2 border-black rounded-sm mb-8">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 border-b-2 border-black">
              <th className="p-3 text-left uppercase tracking-widest text-[10px] font-black border-r border-black w-[20%]">Organ / Row</th>
              <th className="p-3 text-left uppercase tracking-widest text-[10px] font-black border-r border-black w-[40%]">Column A</th>
              <th className="p-3 text-left uppercase tracking-widest text-[10px] font-black w-[40%]">Column B</th>
            </tr>
          </thead>
          <tbody className="divide-y border-black">
            {[1, 2, 3, 4, 5, 6].map((rowNum) => (
              <tr key={rowNum} className="border-b border-black last:border-0">
                <td className="p-3 border-r border-black bg-slate-50/50 align-middle">
                  <p className="font-bold text-base leading-tight">Row {rowNum}</p>
                  <p className="text-[10px] font-medium text-slate-600 mt-1">{ROW_DATA[rowNum].organ}</p>
                </td>
                <td className="p-3 border-r border-black align-top">
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    {EMOTION_CODE_CHART[rowNum].columnA.map(e => (
                      <div key={e} className="text-sm font-medium">• {e}</div>
                    ))}
                  </div>
                </td>
                <td className="p-3 align-top">
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    {EMOTION_CODE_CHART[rowNum].columnB.map(e => (
                      <div key={e} className="text-sm font-medium">• {e}</div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Associated Muscles Reference */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest border-b border-black pb-1">Muscle Verification</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map(rowNum => (
              <div key={rowNum} className="text-[10px] leading-tight">
                <span className="font-bold uppercase text-slate-500">Row {rowNum}:</span>
                <p className="mt-0.5 text-slate-800">{ROW_DATA[rowNum].muscles}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest border-b border-black pb-1">Clinical Protocol</h3>
          <div className="space-y-3 text-[10px] leading-relaxed">
            <p><strong>1. Permission:</strong> Confirm system readiness to assess/correct.</p>
            <p><strong>2. Identification:</strong> Use Pulse Points + Chart to find the trapped emotion.</p>
            <p><strong>3. Verification:</strong> Test associated muscles (listed left) to confirm the circuit.</p>
            <p><strong>4. Context:</strong> Identify Age, Event, and if Inherited (10 swipes if inherited).</p>
            <p><strong>5. Correction:</strong> Stimulate Heart Referral Zone + Hold Pulse Point + Tap Efferent Zones.</p>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="p-6 border-2 border-black bg-slate-50 rounded-sm italic text-xs leading-relaxed text-center">
        "A Heart-Wall is a protective barrier created by the subconscious. Dismantle it with respect—it was built for a reason. Always wait for a clear parasympathetic response before proceeding."
      </div>

      <div className="mt-12 pt-4 border-t border-slate-200 text-center">
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">Resonance Clinical Infrastructure • Confidential Practitioner Resource</p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
};

export default HeartWallPrintable;