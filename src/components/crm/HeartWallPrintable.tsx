"use client";

import React from 'react';
import { EMOTION_CODE_CHART, ROW_DATA } from '@/data/emotion-code-data';
import { cn } from '@/lib/utils';

const HeartWallPrintable = () => {
  // Data mapped directly from the provided CSV for accuracy
  const rows = [
    {
      organ: "HEART OR SMALL INTESTINE",
      emotions: ["Abandonment", "Betrayal", "Defensiveness", "Forlorn", "Lost", "Love Unreceived", "Effort Unreceived", "Heartache", "Bitterness", "Insecurity", "Overjoy", "Vulnerability"],
      muscles: "Heart: Vastus Lateralis, Subscapularis; Small Intestine: Quads, Abdominals"
    },
    {
      organ: "SPLEEN OR STOMACH",
      emotions: ["Anxiety", "Despair", "Disgust", "Nervousness", "Worry", "Failure", "Helplessness", "Hopelessness", "Lack of Control", "Low Self-Esteem"],
      muscles: "Spleen: Triceps, Mid and Lower Traps; Stomach: PMC, Diaphragm, Neck Flexors"
    },
    {
      organ: "LUNG OR COLON",
      emotions: ["Crying", "Discouragement", "Sadness", "Sorrow", "Confusion", "Grief", "Self-Abuse", "Shame", "Unworthy", "Worthless"],
      muscles: "Lungs: Posterior Deltoid; Colon: TFL, Glute Max, QL"
    },
    {
      organ: "LIVER OR GALLBLADDER",
      emotions: ["Anger", "Blaming", "Rejection", "Guilt", "Hatred", "Resentment", "Depression", "Frustration", "Indecisiveness", "Taken for Granted", "Stubbornness"],
      muscles: "Liver: PMS, Rhomboids; Gallbladder: Anterior Deltoid, Popliteus"
    },
    {
      organ: "KIDNEYS OR BLADDER",
      emotions: ["Dread", "Fear", "Horror", "Peeved", "Conflict", "Insecurity", "Terror", "Panic", "Unsupported", "Wishy Washy"],
      muscles: "Kidney: Psoas, Upper Traps; Bladder: Erector Spinae"
    },
    {
      organ: "GLANDS OR SEXUAL ORGANS",
      emotions: ["Humiliation", "Jealousy", "Longing", "Lust", "Overwhelm", "Pride", "Shock"],
      muscles: "Adrenals: Piriformis, Flexor Hallucis Longus; Thyroid: Supraspinatus; Reproductive: Glute Medius"
    }
  ];

  return (
    <div className="bg-white text-black p-10 max-w-[210mm] mx-auto font-sans print:p-0 print:m-0">
      {/* Header */}
      <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-bold tracking-tight uppercase">Heart Wall Emotions Table</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Resonance Clinical Infrastructure • Protocol v2.2</p>
        </div>
        <div className="text-right">
          <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-2xl rounded-xl mb-2 ml-auto shadow-lg">H</div>
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Fractal Resolution OS</p>
        </div>
      </div>

      {/* The Master Grid */}
      <div className="overflow-hidden border-2 border-black rounded-none mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b-2 border-black">
              <th className="p-3 text-left uppercase tracking-widest text-[10px] font-black border-r border-black w-[22%]">Organ Group</th>
              <th className="p-3 text-center uppercase tracking-widest text-[10px] font-black border-r border-black w-[40%]">Trapped Emotions</th>
              <th className="p-3 text-left uppercase tracking-widest text-[10px] font-black w-[38%]">Associated Muscles</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 border-black">
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-black last:border-0">
                <td className="p-4 border-r border-black bg-slate-50/50 align-middle">
                  <p className="font-black text-[11px] leading-tight text-black">
                    {row.organ}
                  </p>
                </td>
                <td className="p-4 border-r border-black align-top">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {row.emotions.map(e => (
                      <div key={e} className="text-[11px] font-bold flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-black shrink-0" />
                        {e}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="space-y-2">
                    {row.muscles.split('; ').map((group, i) => {
                      const [organ, list] = group.split(': ');
                      return (
                        <div key={i} className="text-[10px] leading-tight">
                          <span className="font-black uppercase text-slate-500">{organ}:</span>
                          <p className="mt-0.5 text-black font-bold">{list}</p>
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clinical Protocol Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8">
          <div className="p-5 border-2 border-black rounded-none bg-slate-50 h-full">
            <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-black pb-2 mb-3 flex items-center gap-2">
              Quick Release Protocol
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[10px] font-medium leading-relaxed">
              <p><strong>1. Permission:</strong> Confirm system readiness to assess.</p>
              <p><strong>2. Identify:</strong> Use Pulse Points to find Row/Column/Emotion.</p>
              <p><strong>3. Verify:</strong> Test associated muscles to confirm circuit.</p>
              <p><strong>4. Context:</strong> Identify Age and if Inherited (10 swipes).</p>
              <p><strong>5. Correct:</strong> Stim Heart Zone + Hold PP + Tap Efferent.</p>
              <p><strong>6. Embed:</strong> Wait for shift (sigh/yawn) before re-test.</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-4">
          <div className="p-5 border-2 border-black rounded-none bg-black text-white h-full flex flex-col justify-center text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2">Clinical Rule</p>
            <p className="text-[11px] font-serif italic leading-relaxed">
              "Dismantle the wall with respect—it was built for a reason."
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-slate-200 text-center">
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">
          Confidential Practitioner Resource • Resonance Clinical Infrastructure
        </p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 8mm;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default HeartWallPrintable;