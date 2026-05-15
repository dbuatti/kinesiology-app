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
    <div className={cn("space-y-4 mb-8", className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-0" />}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {Icon && (
            <div className={cn(
              "w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/20 shrink-0 transition-transform hover:scale-105 duration-500",
              iconClassName
            )}>
              <Icon size={28} />
            </div>
          )}
          <div className="space-y-1">
            {badge && (
              <Badge className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-none font-black text-[8px] uppercase tracking-[0.4em] px-4 py-1 rounded-full mb-2 shadow-sm">
                {badge}
              </Badge>
            )}
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm md:text-base text-slate-500 font-medium max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
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