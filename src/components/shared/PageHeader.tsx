"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Breadcrumbs from "./Breadcrumbs";
import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  iconClassName?: string;
  breadcrumbs?: { label: string; path?: string }[];
  badge?: string;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  iconClassName,
  breadcrumbs,
  badge,
  actions,
  className,
}: PageHeaderProps) => {
  return (
    <div className={cn("space-y-8 mb-16", className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-0 opacity-40 hover:opacity-100 transition-opacity duration-300" />}
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4 flex-1">
          {badge && (
            <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-none font-black text-[9px] uppercase tracking-[0.3em] px-4 py-1.5 rounded-full mb-2 shadow-sm">
              {badge}
            </Badge>
          )}
          <div className="flex items-center gap-6">
            {Icon && (
              <div className={cn(
                "w-14 h-14 rounded-[1.25rem] bg-slate-900 text-white flex items-center justify-center shrink-0 dark:bg-white dark:text-slate-900 shadow-xl transition-transform hover:scale-105 duration-500",
                iconClassName
              )}>
                <Icon size={28} />
              </div>
            )}
            <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-4 shrink-0 animate-in fade-in slide-in-from-right-6 duration-1000">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;