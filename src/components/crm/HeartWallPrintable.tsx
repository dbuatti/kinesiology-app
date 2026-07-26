

import { EMOTION_CODE_CHART, ROW_DATA } from '@/data/emotion-code-data';
import { cn } from '@/lib/utils';

const HeartWallPrintable = () => {
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
      muscles: "Lungs: Posterior Deltoid, Serratus Anterior; Colon: TFL, Glute Max, QL"
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
    <div className="bg-card text-foreground p-6 max-w-[210mm] mx-auto font-sans print:p-0 print:m-0">
      {/* Header */}
      <div className="border-b-2 border-foreground/20 pb-2 mb-4 flex justify-between items-end">
        <div className="space-y-0.5">
          <h1 className="text-3xl font-serif font-bold tracking-tight uppercase leading-none">Heart Wall Protocol Sheet</h1>
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em]">Resonance Clinical Infrastructure • Protocol v3.0</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Fractal Resolution OS</p>
        </div>
      </div>

      {/* Screen + Permission + Priority Primary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-2 border-2 border-foreground/20 bg-muted/50">
          <h3 className="text-[8px] font-black uppercase tracking-widest border-b border-foreground/20 pb-0.5 mb-1">Screen</h3>
          <p className="text-[8px] font-bold leading-tight">Qualify IM. Client focuses on RECEIVING. If muscle inhibits → Heart Wall present.</p>
        </div>
        <div className="p-2 border-2 border-foreground/20 bg-muted/50">
          <h3 className="text-[8px] font-black uppercase tracking-widest border-b border-foreground/20 pb-0.5 mb-1">Assess Priority Primary</h3>
          <p className="text-[8px] font-bold leading-tight">PP → find emotion/organ → test muscles → find brain zones → CH (inherit?)</p>
        </div>
        <div className="p-2 border-2 border-foreground/20 bg-muted/50">
          <h3 className="text-[8px] font-black uppercase tracking-widest border-b border-foreground/20 pb-0.5 mb-1">Count Layers</h3>
          <p className="text-[8px] font-bold leading-tight">&gt;5 &gt;10 &gt;15 &gt;20 &gt;25. Narrow to exact number. Track before/after.</p>
        </div>
      </div>

      {/* The Master Grid */}
      <div className="overflow-hidden border-2 border-foreground/20 rounded-none mb-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted border-b-2 border-foreground/20">
              <th className="p-2 text-left uppercase tracking-widest text-[9px] font-black border-r border-foreground/20 w-[22%]">Organ Group</th>
              <th className="p-2 text-center uppercase tracking-widest text-[9px] font-black border-r border-foreground/20 w-[40%]">Trapped Emotions</th>
              <th className="p-2 text-left uppercase tracking-widest text-[9px] font-black w-[38%]">Associated Muscles</th>
            </tr>
          </thead>
          <tbody className="divide-y border-foreground/20">
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-foreground/20 last:border-0">
                <td className="p-2 border-r border-foreground/20 bg-muted/50 align-middle">
                  <p className="font-black text-[10px] leading-tight text-foreground">
                    {row.organ}
                  </p>
                </td>
                <td className="p-2 border-r border-foreground/20 align-top">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {row.emotions.map(e => (
                      <div key={e} className="text-[10px] font-bold flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-foreground shrink-0" />
                        {e}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-2 align-top">
                  <div className="space-y-1.5">
                    {row.muscles.split('; ').map((group, i) => {
                      const [organ, list] = group.split(': ');
                      return (
                        <div key={i} className="text-[9px] leading-tight">
                          <span className="font-black uppercase text-muted-foreground">{organ}:</span>
                          <p className="mt-0.5 text-foreground font-bold">{list}</p>
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

      {/* Correction Protocol */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8">
          <div className="p-3 border-2 border-foreground/20 rounded-none bg-muted/50 h-full">
            <h3 className="text-[9px] font-black uppercase tracking-widest border-b border-foreground/20 pb-1 mb-2 flex items-center gap-2">
              Correction Protocol
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[9px] font-medium leading-tight">
              <p><strong>1.</strong> Permission to correct</p>
              <p><strong>2.</strong> Stim Heart Visceral Referral Zone (chest → ulnar arm)</p>
              <p><strong>3.</strong> Hold organ pulse point (or squeeze associated muscle)</p>
              <p><strong>4.</strong> Tap efferent zones — 3 swipes (10 if inherited)</p>
              <p><strong>5.</strong> Recheck muscles + count remaining layers</p>
              <p><strong>6.</strong> Client hand ❤️ + organ for integration</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-4">
          <div className="p-3 border-2 border-foreground/20 rounded-none bg-foreground text-primary-foreground h-full flex flex-col justify-center text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] mb-1">Clinical Rule</p>
            <p className="text-[10px] font-serif italic leading-tight">
              "Dismantle the wall with respect."
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-2 border-t border-border text-center">
        <p className="text-[7px] font-black text-muted-foreground/60 uppercase tracking-[0.5em]">
          Confidential Practitioner Resource • Resonance Clinical Infrastructure
        </p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 5mm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
          }
          body * {
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HeartWallPrintable;
