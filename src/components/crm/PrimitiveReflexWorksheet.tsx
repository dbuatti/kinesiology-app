
import { PRIMITIVE_REFLEXES } from '@/data/primitive-reflex-data';
import { cn } from '@/lib/utils';

const PrimitiveReflexWorksheet = () => {
  return (
    <div className="bg-card text-foreground p-4 max-w-[297mm] mx-auto font-sans print:p-0 print:m-0">
      {/* Header Section */}
      <div className="border-b-2 border-border pb-1 mb-2 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Primitive Reflex Worksheet</h1>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Clinical Assessment Log • Foundational OS</p>
        </div>
        <div className="text-right flex gap-8">
          <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Client: ________________________</p>
          <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Date: ___/___/___</p>
        </div>
      </div>

      <div className="overflow-hidden border border-foreground/20 rounded-none">
        <table className="w-full border-collapse text-[10px] leading-tight">
          <thead>
            <tr className="bg-muted border-b border-foreground/20">
              <th className="p-1 text-left font-black uppercase border-r border-foreground/20 w-[12%]">Reflex</th>
              <th className="p-1 text-center font-black uppercase border-r border-foreground/20 w-[6%]">Inhib</th>
              <th className="p-1 text-left font-black uppercase border-r border-foreground/20 w-[42%]">Stimulus & Inhibition Pattern</th>
              <th className="p-1 text-left font-black uppercase w-[40%]">Clinical Notes / Observations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {PRIMITIVE_REFLEXES.map((reflex) => {
              return (
                <tr key={reflex.id} className="break-inside-avoid">
                  <td className="p-1 border-r border-foreground/20 bg-muted/30">
                    <p className="font-black text-[11px] leading-none">{reflex.name}</p>
                    <p className="font-bold text-[7px] text-muted-foreground uppercase mt-0.5">{reflex.category}</p>
                  </td>
                  
                  <td className="p-0.5 border-r border-foreground/20">
                    <div className="flex justify-center gap-2">
                      {reflex.isLateralized ? (
                        <>
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="w-3.5 h-3.5 border border-foreground/20 rounded-none" />
                            <span className="font-black text-[7px]">L</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="w-3.5 h-3.5 border border-foreground/20 rounded-none" />
                            <span className="font-black text-[7px]">R</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-3.5 h-3.5 border border-foreground/20 rounded-none" />
                          <span className="font-black text-[7px]">Inhib</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="p-1 border-r border-foreground/20 align-top">
                    <div className="space-y-1">
                      <p className="text-[9px] leading-tight">
                        <span className="font-black uppercase text-muted-foreground mr-1">Stim:</span>
                        {reflex.stimulus}
                      </p>
                      <p className="text-[9px] leading-tight font-bold text-foreground">
                        <span className="font-black uppercase text-rose-400 mr-1">Pattern:</span>
                        {reflex.inhibitionPattern}
                      </p>
                    </div>
                  </td>

                  <td className="p-1 align-top relative">
                    <div className="space-y-2">
                      <div className="h-px w-full bg-muted mt-1" />
                      <div className="h-px w-full bg-muted" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Section */}
      <div className="mt-2 p-2 border border-foreground/20 bg-muted/50 flex justify-between items-start gap-8">
        <div className="space-y-1 flex-1">
          <h4 className="font-black text-[10px] uppercase tracking-widest border-b border-foreground/10 pb-0.5">Fractal Logic</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[8px] font-bold uppercase">
            <p>• Fear Paralysis → Moro → Startle</p>
            <p>• ATNR → Babinski → Palmar</p>
            <p>• Rooting → Sucking</p>
            <p>• TLR (Extension / Flexion) → ATNR → STNR (Extension / Flexion)</p>
          </div>
        </div>
        <div className="space-y-1 flex-[2]">
          <p className="text-[9px] font-black text-muted-foreground uppercase">Primary Correction & Integration Plan:</p>
          <div className="h-px w-full bg-muted mt-2" />
          <div className="h-px w-full bg-muted mt-2" />
        </div>
      </div>

      <div className="mt-2 pt-0.5 border-t border-border text-center">
        <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-[0.5em]">Resonance Clinical Infrastructure • Worksheet v1.2</p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
          }
          body * {
            visibility: visible !important;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default PrimitiveReflexWorksheet;