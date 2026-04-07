"use client";

import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssessmentSectionProps {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  count: number;
  inhibitedCount: number;
  protocol?: React.ReactNode;
  onClearAll?: () => void;
}

const AssessmentSection = ({ id, title, description, icon: Icon, children, count, inhibitedCount, protocol, onClearAll }: AssessmentSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} id={id} className="scroll-mt-32 space-y-4 md:space-y-6">
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 md:p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-2xl md:rounded-[2rem] transition-colors group">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Icon size={20} className="md:w-7 md:h-7" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-2xl font-black text-foreground tracking-tight truncate">{title}</h3>
              <p className="text-muted-foreground font-medium text-[10px] md:text-sm truncate">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {count > 0 && (
              <div className="hidden sm:flex gap-2">
                <Badge className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">{count - inhibitedCount} Clear</Badge>
                <Badge className={cn(
                  "border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full",
                  inhibitedCount > 0 ? "bg-rose-600 text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                )}>
                  {inhibitedCount} Inhibited
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-1 md:gap-2" onClick={(e) => e.stopPropagation()}>
              {onClearAll && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClearAll}
                  className="h-7 md:h-8 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-lg md:rounded-xl"
                >
                  <CheckCircle2 size={12} className="mr-1 md:mr-1.5" /> <span className="hidden sm:inline">Mark All Clear</span><span className="sm:hidden">Clear All</span>
                </Button>
              )}
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <ChevronDown className={cn("h-5 w-5 md:h-6 md:w-6 transition-transform duration-300", isOpen && "rotate-180")} />
              </div>
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-1 md:px-6 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
          {protocol && (
            <div className="p-4 md:p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl md:rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
              {protocol}
            </div>
          )}
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AssessmentSection;