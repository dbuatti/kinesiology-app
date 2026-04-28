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
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-0" />}
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          {Icon && (
            <div className={cn(
              "w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-100 dark:shadow-indigo-900/20 shrink-0",
              iconClassName
            )}>
              <Icon size={32} />
            </div>
          )}
          <div className="space-y-1">
            {badge && (
              <Badge className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-none font-bold text-[8px] uppercase tracking-[0.3em] px-3 py-1 rounded-full mb-2">
                {badge}
              </Badge>
            )}
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm md:text-base text-slate-500 font-medium max-w-2xl">
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