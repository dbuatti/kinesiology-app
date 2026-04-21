"use client";

import React, { useState } from 'react';
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
  GripVertical,
  Plus,
  Zap
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

interface FractalNodeProps {
  item: any;
  children?: React.ReactNode;
  level: number;
  onUpdateRating: (id: string, rating: number) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, parentId: string | null) => void;
  onProcess: (item: any) => void;
  allPossibleParents: any[];
}

const FractalNode = ({ 
  item, 
  children, 
  level, 
  onUpdateRating, 
  onDelete, 
  onMove,
  onProcess,
  allPossibleParents 
}: FractalNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = React.Children.count(children) > 0;

  const getIcon = () => {
    if (item.type === 'alignment') return <Target size={18} className="text-emerald-600" />;
    if (item.type === 'belief') return <ShieldAlert size={18} className="text-rose-600" />;
    return <Fingerprint size={18} className="text-indigo-600" />;
  };

  const getBgColor = () => {
    if (item.type === 'alignment') return "bg-emerald-50 dark:bg-emerald-900/20";
    if (item.type === 'belief') return "bg-rose-50 dark:bg-rose-900/20";
    return "bg-indigo-50 dark:bg-indigo-900/20";
  };

  return (
    <div className="space-y-1">
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-2xl border transition-all group",
          level === 0 ? "bg-card border-border shadow-sm" : "bg-muted/30 border-transparent hover:border-border",
          item.priority_score > 80 && "ring-1 ring-indigo-500/30"
        )}
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className="flex items-center gap-2 shrink-0">
          {hasChildren ? (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-6 h-6 rounded-lg hover:bg-muted flex items-center justify-center text-slate-400 transition-colors"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <div className="w-6" />
          )}
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-inner", getBgColor())}>
            {getIcon()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm text-foreground truncate">"{item.content}"</p>
            {item.priority_score > 0 && (
              <Badge variant="outline" className="text-[7px] font-black px-1.5 py-0 border-indigo-200 text-indigo-600">
                {item.priority_score}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <StarRating 
              rating={item.muscle_test_stars || 0} 
              onRatingChange={(r) => onUpdateRating(item.id, r)}
              size={12}
            />
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
              Muscle Test Priority
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-1 shadow-2xl border-none bg-card">
              <DropdownMenuItem onClick={() => onProcess(item)} className="rounded-lg py-2 px-3 cursor-pointer flex items-center gap-2">
                <Zap size={14} className="text-indigo-500" /> Process in Sandbox
              </DropdownMenuItem>
              
              <div className="px-2 py-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400">Move to Parent</div>
              {item.parent_id && (
                <DropdownMenuItem onClick={() => onMove(item.id, null)} className="rounded-lg py-2 px-3 cursor-pointer flex items-center gap-2">
                  <ArrowRight size={14} className="rotate-180" /> Move to Top Level
                </DropdownMenuItem>
              )}
              {allPossibleParents
                .filter(p => p.id !== item.id && p.id !== item.parent_id)
                .slice(0, 5)
                .map(parent => (
                  <DropdownMenuItem 
                    key={parent.id} 
                    onClick={() => onMove(item.id, parent.id)}
                    className="rounded-lg py-2 px-3 cursor-pointer flex items-center gap-2 truncate"
                  >
                    <Plus size={14} /> Under: {parent.content}
                  </DropdownMenuItem>
                ))}
              
              <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive focus:text-destructive rounded-lg py-2 px-3 cursor-pointer flex items-center gap-2">
                <Trash2 size={14} /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            size="sm" 
            className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest shadow-sm"
            onClick={() => onProcess(item)}
          >
            Process <ChevronRight size={12} className="ml-1" />
          </Button>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default FractalNode;