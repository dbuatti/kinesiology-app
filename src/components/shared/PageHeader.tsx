"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Breadcrumbs from "./Breadcrumbs";

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
    <div className={cn("space-y-4 mb-8 border-b border-border pb-8", className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-0" />}
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex items-start gap-6">
          {Icon && (
            <div className={cn(
              "w-12 h-12 border border-border flex items-center justify-center text-primary shrink-0",
              iconClassName
            )}>
              <Icon size={24} />
            </div>
          )}
          <div className="space-y-2">
            {badge && (
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                {badge}
              </p>
            )}
            <h1 className="text-3xl font-medium uppercase tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-4 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;