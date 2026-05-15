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
  protocol?: React.ReactNode;
  onClearAll?: () => void;
}

const AssessmentSection = ({ id, title, description, icon: Icon, children, count, inhibitedCount, protocol, onClearAll }: AssessmentSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div id={id} className="scroll-mt-40 border border-border bg-background">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-8 cursor-pointer hover:bg-muted transition-colors border-b border-border">
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-12 h-12 border border-border flex items-center justify-center transition-colors",
                isOpen ? "bg-primary text-primary-foreground border-primary" : "text-primary"
              )}>
                <Icon size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-medium uppercase tracking-tight">{title}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              {count > 0 && (
                <div className="hidden sm:flex gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-success">
                    {count - inhibitedCount} Clear
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    inhibitedCount > 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {inhibitedCount} Inhibited
                  </span>
                </div>
              )}
              
              <ChevronDown className={cn("h-6 w-6 transition-transform text-muted-foreground", isOpen && "rotate-180")} />
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-8 space-y-8">
            {protocol && (
              <div className="p-6 border border-primary/20 bg-primary/5">
                {protocol}
              </div>
            )}
            {children}
            
            {onClearAll && inhibitedCount > 0 && (
              <div className="flex justify-center pt-8 border-t border-border">
                <button 
                  onClick={(e) => { e.stopPropagation(); onClearAll(); }}
                  className="h-12 px-8 border border-border font-bold text-[10px] uppercase tracking-widest hover:bg-muted transition-colors flex items-center gap-3"
                >
                  <Check size={16} /> Mark Entire Section as Clear
                </button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AssessmentSection;