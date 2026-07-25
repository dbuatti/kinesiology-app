
import type { ElementType, ReactNode } from 'react';
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ElementType;
  iconClassName?: string;

  badge?: string;
  actions?: ReactNode;
  className?: string;
}

const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  iconClassName,

  badge,
  actions,
  className,
}: PageHeaderProps) => {
  return (
    <div className={cn("space-y-3 md:space-y-5 mb-4 md:mb-8", className)}>


      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10">
        <div className="space-y-3 md:space-y-4 flex-1">
          {badge && (
            <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-none font-black text-[9px] uppercase tracking-[0.3em] px-4 py-1.5 rounded-full mb-1 md:mb-2 shadow-sm">
              {badge}
            </Badge>
          )}
          <div className="flex items-center gap-4 md:gap-6">
            {Icon && (
              <div className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-[1rem] bg-card text-white flex items-center justify-center shrink-0 dark:bg-white dark:text-foreground shadow-xl transition-transform hover:scale-105 duration-500",
                iconClassName
              )}>
                <Icon size={20} className="md:w-6 md:h-6" />
              </div>
            )}
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground dark:text-white leading-none">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-sm md:text-base text-muted-foreground dark:text-muted-foreground font-medium max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3 md:gap-4 shrink-0 animate-in fade-in slide-in-from-right-6 duration-1000">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;