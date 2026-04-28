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
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className={cn(
              "w-14 h-14 rounded-[1.25rem] bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 shrink-0",
              iconClassName
            )}>
              <Icon size={28} />
            </div>
          )}
          <div className="space-y-0.5">
            {badge && (
              <Badge className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-none font-bold text-[8px] uppercase tracking-[0.3em] px-3 py-0.5 rounded-full mb-1">
                {badge}
              </Badge>
            )}
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs md:text-sm text-slate-500 font-medium max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;