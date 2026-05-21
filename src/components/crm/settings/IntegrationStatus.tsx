"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface IntegrationStatusProps {
  name: string;
  icon: LucideIcon;
  description: string;
  status?: string;
}

const IntegrationStatus = ({ name, icon: Icon, description, status = "Connected" }: IntegrationStatusProps) => {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-indigo-600">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-black text-slate-900 dark:text-white">{name}</p>
          <p className="text-[10px] text-slate-500 font-medium">{description}</p>
        </div>
      </div>
      <Badge className={cn(
        "border-none font-black text-[8px] uppercase tracking-widest",
        status === "Connected" ? "bg-emerald-50 text-white" : "bg-amber-500 text-white"
      )}>
        {status}
      </Badge>
    </div>
  );
};

export default IntegrationStatus;