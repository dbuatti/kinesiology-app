"use client";

import React from 'react';
import { EMOTION_CODE_CHART, ROW_DATA } from '@/data/emotion-code-data';
import { cn } from '@/lib/utils';

const HeartWallPrintable = () => {
  return (
    <div className="bg-white text-black p-12 max-w-[210mm] mx-auto font-sans print:p-0 print:m-0">
      {/* Header */}
      <div className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-bold tracking-tight uppercase">The Heart-Wall Chart</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Resonance Clinical Infrastructure • Protocol v2.1</p>
        </div>
        <div className="text-right">
          <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-2xl rounded-xl mb-2 ml-auto">H</div>
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Fractal Resolution OS</p>
        </div>
      </div>

      {/* The Master Grid */}
      <div className="overflow-hidden border-2 border-black rounded-none mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b-2 border-black">
              <th className="p-4 text-left uppercase tracking-widest text-[11px] font-black border-r border-black w-[22%]">Organ / Gland</th>
              <th className="p-4 text-center uppercase tracking-widest text-[11px] font-black border-r border-black w-[39%]">Column A</th>
              <th className="p-4 text-center uppercase tracking-widest text-[11px] font-black w-[39%]">Column B</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 border-black">
            {[1, 2, 3, 4, 5, 6].map((rowNum) => (
              <tr key={rowNum} className="border-b border-black last:border-0">
                <td className="p-4 border-r border-black bg-slate-50/50 align-middle">
                  <div className="space-y-1">
                    <p className="font-black text-xs uppercase text-slate-500">Row {rowNum}</p>
                    <p className="font-bold text-base leading-tight text-black">
                      {ROW_DATA[rowNum].organ}
                    </p>
                  </div>
                </td>
                <td className="p-4 border-r border-black align-top">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {EMOTION_CODE_CHART[rowNum].columnA.map(e => (
                      <div key={e} className="text-sm font-bold flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-black shrink-0" />
                        {e}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {EMOTION_CODE_CHART[rowNum].columnB.map(e => (
                      <div key={e} className="text-sm font-bold flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-black shrink-0" />
                        {e}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clinical Protocol & Verification */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 space-y-6">
          <div className="p-6 border-2 border-black rounded-none bg-slate-50">
            <h3 className="text-xs font-black uppercase tracking-widest border-b border-black pb-2 mb-4 flex items-center gap-2">
              Quick Release Protocol
            </h3>
            <div className="grid grid-cols-1 gap-3 text-[11px] font-medium leading-relaxed">
              <p><strong>1. Identify:</strong> Use Pulse Points to find the Row, then Column, then specific Emotion.</p>
              <p><strong>2. Verify:</strong> Test associated muscles (see right) to confirm the neurological circuit.</p>
              <p><strong>3. Context:</strong> Identify Age of origin and if the emotion is Inherited (10 swipes if yes).</p>
              <p><strong>4. Correct:</strong> Stimulate Heart Referral Zone + Hold Pulse Point + Tap Efferent Zones.</p>
              <p><strong>5. Embed:</strong> Wait for parasympathetic shift (sigh/yawn) before re-testing the IM.</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest border-b border-black pb-2 mb-2">
            Muscle Verification
          </h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map(rowNum => (
              <div key={rowNum} className="text-[10px] leading-tight">
                <span className="font-black uppercase text-slate-400">Row {rowNum}:</span>
                <p className="mt-0.5 text-black font-bold">{ROW_DATA[rowNum].muscles.split('; ')[0]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-slate-200 text-center space-y-2">
        <p className="text-[10px] font-serif italic text-slate-500 max-w-xl mx-auto">
          "A Heart-Wall is a protective barrier created by the subconscious. Dismantle it with respect—it was built for a reason."
        </p>
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] pt-4">
          Confidential Practitioner Resource • Resonance Clinical Infrastructure
        </p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default HeartWallPrintable;