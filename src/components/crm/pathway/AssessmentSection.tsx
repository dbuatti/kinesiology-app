"use client";

import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssessmentSectionProps {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  count: number;
  inhibitedCount: number;
}

const AssessmentSection = ({ id, title, description, icon: Icon, children, count, inhibitedCount }: AssessmentSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div id={id} className="scroll-mt-32 border border-slate-100 bg-white">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "h-10 flex items-center justify-between px-4 cursor-pointer transition-all",
            isOpen ? "bg-slate-50" : "hover:bg-slate-50"
          )}>
            <div className="flex items-center gap-3">
              <Icon size={14} className="text-primary" />
              <div className="flex items-baseline gap-2">
                <h3 className="text-[11px] font-black uppercase tracking-widest">{title}</h3>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">— {description}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex gap-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
                  {count - inhibitedCount} OK
                </span>
                {inhibitedCount > 0 && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-600">
                    {inhibitedCount} INHIB
                  </span>
                )}
              </div>
              <ChevronDown size={14} className={cn("transition-transform text-slate-300", isOpen && "rotate-180")} />
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AssessmentSection;