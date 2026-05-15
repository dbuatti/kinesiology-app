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
    <div className={cn("space-y-6 mb-10", className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-0 opacity-60" />}
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          {badge && (
            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none font-bold text-[9px] uppercase tracking-widest px-3 py-0.5 rounded-full mb-2">
              {badge}
            </Badge>
          )}
          <div className="flex items-center gap-4">
            {Icon && (
              <div className={cn(
                "w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 dark:bg-white dark:text-slate-900",
                iconClassName
              )}>
                <Icon size={20} />
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2 shrink-0 animate-in fade-in slide-in-from-right-2 duration-500">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;