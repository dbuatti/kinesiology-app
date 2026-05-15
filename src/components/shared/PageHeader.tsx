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
    <div className={cn("space-y-6 mb-12", className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-0 opacity-60" />}
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          {badge && (
            <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-none font-black text-[9px] uppercase tracking-[0.3em] px-4 py-1 rounded-full mb-2">
              {badge}
            </Badge>
          )}
          <div className="flex items-center gap-5">
            {Icon && (
              <div className={cn(
                "w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 dark:bg-white dark:text-slate-900 shadow-lg",
                iconClassName
              )}>
                <Icon size={24} />
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-base md:text-lg text-slate-500 font-medium max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3 shrink-0 animate-in fade-in slide-in-from-right-4 duration-700">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;