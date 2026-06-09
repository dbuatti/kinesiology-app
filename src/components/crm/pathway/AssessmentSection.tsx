
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
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen} 
      id={id} 
      className="scroll-mt-40 space-y-4 md:space-y-6"
    >
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 md:p-6 cursor-pointer hover:bg-muted/50 rounded-xl transition-all duration-300 group border border-transparent hover:border-border">
          <div className="flex items-center gap-3 md:gap-5">
            <div className={cn(
              "w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm transition-all duration-500",
              isOpen ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <Icon size={20} className="md:w-7 md:h-7" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-2xl font-medium text-foreground tracking-tight truncate">{title}</h3>
              <p className="text-muted-foreground font-medium text-[10px] md:text-sm truncate">{description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {count > 0 && (
              <div className="hidden sm:flex gap-2">
                <Badge variant="outline" className="bg-chart-emerald/10 text-chart-emerald border-chart-emerald/20 font-medium text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                  {count - inhibitedCount} Clear
                </Badge>
                <Badge className={cn(
                  "border-none font-medium text-[10px] uppercase tracking-wider px-3 py-1 rounded-full transition-all duration-500",
                  inhibitedCount > 0 ? "bg-destructive text-destructive-foreground shadow-sm" : "bg-muted text-muted-foreground"
                )}>
                  {inhibitedCount} Inhibited
                </Badge>
              </div>
            )}
            
            <div className="flex items-center gap-1 md:gap-2" onClick={(e) => e.stopPropagation()}>
              {onClearAll && !isOpen && inhibitedCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClearAll}
                  className="h-7 md:h-8 text-[8px] md:text-[9px] font-medium uppercase tracking-widest text-primary hover:bg-primary/10 rounded-lg md:rounded-xl animate-in fade-in zoom-in-95"
                >
                  <CheckCircle2 size={12} className="mr-1 md:mr-1.5" /> 
                  <span className="hidden sm:inline">Mark All Clear</span>
                  <span className="sm:hidden">Clear All</span>
                </Button>
              )}
              <div className={cn(
                "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-500",
                isOpen ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground"
              )}>
                <ChevronDown className={cn("h-5 w-5 md:h-6 md:w-6 transition-transform duration-500", isOpen && "rotate-180")} />
              </div>
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="overflow-hidden transition-all">
        <div className="px-1 md:px-6 pb-4 space-y-6 md:space-y-8 animate-in fade-in duration-700">
          {protocol && (
            <div className="p-4 md:p-6 bg-muted rounded-xl border border-border shadow-inner">
              {protocol}
            </div>
          )}
          {children}
          
          {onClearAll && inhibitedCount > 0 && (
            <div className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={onClearAll}
                className="rounded-xl border-primary/20 text-primary hover:bg-primary/10 font-medium text-[10px] uppercase tracking-wider h-10 px-8"
              >
                <CheckCircle2 size={14} className="mr-2" /> Mark Entire Section as Clear
              </Button>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AssessmentSection;
