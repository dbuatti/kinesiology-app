
import { Fragment } from 'react';
import { 
  Wind, 
  Eye, 
  Baby, 
  Move, 
  RotateCcw, 
  RefreshCw, 
  Footprints, 
  Zap,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LADDER_STEPS = [
  { label: "Breath", icon: Wind, sub: "Moro Activation" },
  { label: "Eye Tracking", icon: Eye, sub: "Visual Mapping" },
  { label: "Head Control", icon: Baby, sub: "Neck Stability" },
  { label: "Rolling", icon: RotateCcw, sub: "Core Integration" },
  { label: "Rocking", icon: RefreshCw, sub: "Crawling Prep" },
  { label: "Crawling", icon: Move, sub: "STNR Integration" },
  { label: "Standing", icon: Zap, sub: "Verticality" },
  { label: "Walking", icon: Footprints, sub: "Gait Integration" },
];

const PrimitiveDevelopmentLadder = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
          <TrendingUp size={16} className="text-indigo-500" /> Developmental Hierarchy
        </h3>
      </div>

      <div className="relative flex items-center justify-between gap-2 overflow-x-auto pb-6 no-scrollbar">
        {LADDER_STEPS.map((step, i) => (
          <Fragment key={step.label}>
            <div className="flex flex-col items-center text-center min-w-[100px] group">
              <div className="w-12 h-12 rounded-2xl bg-card border-2 border-border/50 shadow-sm flex items-center justify-center text-muted-foreground group-hover:border-indigo-500 group-hover:text-indigo-600 transition-all duration-500">
                <step.icon size={24} />
              </div>
              <p className="mt-3 text-[10px] font-black text-foreground uppercase tracking-tight">{step.label}</p>
              <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{step.sub}</p>
            </div>
            {i < LADDER_STEPS.length - 1 && (
              <ArrowRight size={16} className="text-muted-foreground/60 shrink-0 mt-[-20px]" />
            )}
          </Fragment>
        ))}
      </div>

      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
        <p className="text-[10px] text-indigo-900 font-medium leading-relaxed italic">
          "Movement development equals cognitive and emotional development. If a client is stuck at the 'Breath' or 'Crawling' phase, higher-level standing/walking patterns will be compromised."
        </p>
      </div>
    </div>
  );
};

export default PrimitiveDevelopmentLadder;