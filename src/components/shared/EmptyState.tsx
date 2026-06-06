
import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className 
}: EmptyStateProps) => {
  return (
    <div className={cn(
      "text-center py-20 bg-muted/30 rounded-[3rem] border-2 border-dashed border-border flex flex-col items-center justify-center animate-in fade-in duration-700",
      className
    )}>
      <div className="w-20 h-20 bg-card rounded-3xl flex items-center justify-center mb-6 shadow-xl">
        <Icon className="text-muted-foreground/40" size={40} />
      </div>
      <h3 className="text-foreground font-black text-xl tracking-tight">{title}</h3>
      <p className="text-muted-foreground mt-2 mb-8 font-medium max-xs mx-auto leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100"
        >
          <Plus size={18} className="mr-2" /> {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;