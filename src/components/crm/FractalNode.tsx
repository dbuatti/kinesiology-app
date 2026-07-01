
import { useState, Children } from 'react';
import type { ReactNode } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Fingerprint, 
  Target, 
  ShieldAlert, 
  MoreHorizontal,
  Trash2,
  ArrowRight,
  RefreshCw,
  Plus,
  Zap,
  Crown,
  Layers,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import StarRating from './StarRating';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

interface FractalNodeProps {
  item: any;
  children?: ReactNode;
  level: number;
  onUpdateRating: (id: string, rating: number) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, parentId: string | null) => void;
  onProcess: (item: any) => void;
  allPossibleParents: any[];
  sessionCount: number;
}

const FractalNode = ({ 
  item, 
  children, 
  level, 
  onUpdateRating, 
  onDelete, 
  onMove,
  onProcess,
  allPossibleParents,
  sessionCount
}: FractalNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = Children.count(children) > 0;

  // Tier Logic: 
  // Level 0 + Children = Grandparent (Tier 3)
  // Level 0 + No Children = Root (Tier 3)
  // Level 1 = Parent (Tier 2)
  // Level 2+ = Child (Tier 1)
  
  const getTierInfo = () => {
    if (level === 0) {
      return { label: hasChildren ? 'Grandparent' : 'Root', tier: 3, color: 'bg-slate-900' };
    }
    if (level === 1) {
      return { label: 'Parent', tier: 2, color: 'bg-indigo-600' };
    }
    return { label: 'Child', tier: 1, color: 'bg-slate-200 text-slate-600' };
  };

  const tierInfo = getTierInfo();
  const progress = Math.min(sessionCount * 20, 100);

  const getIcon = () => {
    if (item.is_primary_primary) return <Crown size={18} className="text-amber-500" />;
    if (item.type === 'alignment') return <Target size={18} className="text-emerald-600" />;
    if (item.type === 'belief') return <ShieldAlert size={18} className="text-rose-600" />;
    return <Fingerprint size={18} className="text-indigo-600" />;
  };

  return (
    <div className="space-y-1">
      <div 
        className={cn(
          "flex items-center gap-3 p-4 rounded-[2rem] border transition-all group",
          level === 0 ? "bg-card border-indigo-100 shadow-md" : "bg-muted/30 border-transparent hover:border-border",
          item.is_primary_primary && "ring-2 ring-amber-500/20 border-amber-200 bg-amber-50/5"
        )}
        style={{ marginLeft: `${level * 32}px` }}
      >
        <div className="flex items-center gap-2 shrink-0">
          {hasChildren ? (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-slate-400 transition-colors"
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <div className="w-8" />
          )}
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110",
            item.is_primary_primary ? "bg-amber-100" : 
            item.type === 'alignment' ? "bg-emerald-50" : 
            item.type === 'belief' ? "bg-rose-50" : "bg-indigo-50"
          )}>
            {getIcon()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {item.is_primary_primary && (
              <Badge className="bg-amber-500 text-white border-none font-black text-[7px] uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-1">
                <Star size={8} className="fill-current" /> Primary Root
              </Badge>
            )}
            <Badge className={cn(
              "border-none font-black text-[7px] uppercase tracking-widest px-2 py-0.5 rounded-md",
              tierInfo.color,
              tierInfo.tier < 2 && "text-slate-600"
            )}>
              Tier {tierInfo.tier}: {tierInfo.label}
            </Badge>
            <p className={cn(
              "font-bold text-sm truncate",
              level === 0 ? "text-lg font-black" : "text-foreground"
            )}>"{item.content}"</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <StarRating 
                rating={item.muscle_test_stars || 0} 
                onRatingChange={(r) => onUpdateRating(item.id, r)}
                size={10}
              />
            </div>
            <div className="flex-1 max-w-[100px] space-y-1">
              <div className="flex justify-between text-[6px] font-black uppercase text-muted-foreground">
                <span>Metabolized</span>
                <span>{sessionCount} Sessions</span>
              </div>
              <Progress value={progress} className="h-1 bg-muted [&>div]:bg-indigo-500" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                <MoreHorizontal size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-3xl border-none bg-card">
              <DropdownMenuItem onClick={() => onProcess(item)} className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3">
                <Zap size={16} className="text-indigo-500" /> Process in Identity Map
              </DropdownMenuItem>
              
              <div className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Move Hierarchy</div>
              {item.parent_id && (
                <DropdownMenuItem onClick={() => onMove(item.id, null)} className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3">
                  <ArrowRight size={16} className="rotate-180" /> Move to Top Level
                </DropdownMenuItem>
              )}
              {allPossibleParents
                .filter(p => p.id !== item.id && p.id !== item.parent_id)
                .slice(0, 5)
                .map(parent => (
                  <DropdownMenuItem 
                    key={parent.id} 
                    onClick={() => onMove(item.id, parent.id)}
                    className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3 truncate"
                  >
                    <Plus size={16} /> Under: {parent.content}
                  </DropdownMenuItem>
                ))}
              
              <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive focus:text-destructive rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3">
                <Trash2 size={16} /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            size="sm" 
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg"
            onClick={() => onProcess(item)}
          >
            Process <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-300 border-l-2 border-slate-100 dark:border-slate-800 ml-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default FractalNode;