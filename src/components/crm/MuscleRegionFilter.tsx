
import { cn } from '@/lib/utils';
import { 
  Brain, 
  Activity, 
  Dumbbell, 
  Footprints, 
  LayoutGrid,
  User
} from 'lucide-react';

interface MuscleRegionFilterProps {
  activeRegion: string;
  onRegionChange: (region: string) => void;
}

const REGIONS = [
  { id: 'All', label: 'Full Body', icon: LayoutGrid, color: 'text-muted-foreground' },
  { id: 'Head & Neck', label: 'Head & Neck', icon: Brain, color: 'text-purple-500' },
  { id: 'Upper Body & Shoulder', label: 'Torso & Shoulders', icon: Activity, color: 'text-rose-500' },
  { id: 'Arm & Hand', label: 'Arms & Hands', icon: Dumbbell, color: 'text-indigo-500' },
  { id: 'Lower Body', label: 'Hips & Legs', icon: User, color: 'text-emerald-500' },
  { id: 'Lower Leg & Foot', label: 'Feet & Ankles', icon: Footprints, color: 'text-primary' },
];

const MuscleRegionFilter = ({ activeRegion, onRegionChange }: MuscleRegionFilterProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {REGIONS.map((region) => {
        const isActive = activeRegion === region.id;
        return (
          <button
            key={region.id}
            onClick={() => onRegionChange(region.id)}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 group",
              isActive 
                ? "bg-indigo-600 border-indigo-600 text-primary-foreground shadow-lg scale-[1.02]" 
                : "bg-card border-border/50 hover:border-indigo-200 text-muted-foreground"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all duration-500",
              isActive ? "bg-card/20" : "bg-muted/50 group-hover:scale-110"
            )}>
              <region.icon size={20} className={cn(isActive ? "text-primary-foreground" : region.color)} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-center">
              {region.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default MuscleRegionFilter;