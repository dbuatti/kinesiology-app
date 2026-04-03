"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} id={id} className="scroll-mt-32">
      <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="p-8 cursor-pointer hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                  <Icon size={28} />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">{title}</CardTitle>
                  <p className="text-slate-500 font-medium">{description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {count > 0 && (
                  <div className="flex gap-2">
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">{count - inhibitedCount} Clear</Badge>
                    <Badge className={cn(
                      "border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full",
                      inhibitedCount > 0 ? "bg-rose-600 text-white shadow-md" : "bg-slate-100 text-slate-400"
                    )}>
                      {inhibitedCount} Inhibited
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {onClearAll && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onClearAll}
                      className="h-8 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-xl"
                    >
                      <CheckCircle2 size={14} className="mr-1.5" /> Mark All Clear
                    </Button>
                  )}
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <ChevronDown className={cn("h-6 w-6 transition-transform duration-300", isOpen && "rotate-180")} />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-8 pt-0 space-y-8">
            {protocol && (
              <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
                {protocol}
              </div>
            )}
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default AssessmentSection;