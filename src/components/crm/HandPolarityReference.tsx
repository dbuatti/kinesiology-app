
import { cn } from '@/lib/utils';
import { Zap, Minus, Plus, Info } from 'lucide-react';
import { FINGER_POLARITIES } from '@/data/emotion-data';

const HandPolarityReference = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <Zap size={14} className="text-amber-500" /> Finger Polarity Guide (98% Population)
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(FINGER_POLARITIES).map(([hand, fingers]) => (
          <div key={hand} className="space-y-3">
            <p className="text-xs font-black text-center uppercase text-slate-500">{hand} Hand</p>
            <div className="grid grid-cols-1 gap-2">
              {fingers.map((f) => (
                <div 
                  key={f.name} 
                  className={cn(
                    "p-3 rounded-xl border-2 flex items-center justify-between transition-all",
                    f.type.includes('IN') ? "bg-rose-50 border-rose-100 text-rose-700" :
                    f.type.includes('OUT') ? "bg-blue-50 border-blue-100 text-blue-700" :
                    "bg-slate-50 border-slate-100 text-slate-400"
                  )}
                >
                  <span className="font-black text-xs uppercase">{f.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold">{f.type}</span>
                    {f.type.includes('IN') ? <Plus size={14} /> : f.type.includes('OUT') ? <Minus size={14} /> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
        <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 font-medium leading-relaxed">
          <strong>Clinical Rule:</strong> Generally, use the <strong>Energy OUT</strong> finger to take stress out of an organ, and <strong>Energy IN</strong> to tonify. Most emotional releases require Energy OUT.
        </p>
      </div>
    </div>
  );
};

export default HandPolarityReference;