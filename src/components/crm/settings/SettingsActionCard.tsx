
import type { ComponentType } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsActionCardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonIcon: ComponentType<any>;
  onClick: () => void;
  loading: boolean;
  themeColor?: 'purple' | 'indigo' | 'emerald' | 'amber' | 'rose';
}

const SettingsActionCard = ({
  title,
  description,
  buttonText,
  buttonIcon: Icon,
  onClick,
  loading,
  themeColor = 'indigo'
}: SettingsActionCardProps) => {
  const borderColors = {
    purple: 'border-purple-100 dark:border-purple-900/30',
    indigo: 'border-indigo-100 dark:border-indigo-900/30',
    emerald: 'border-emerald-100 dark:border-emerald-900/30',
    amber: 'border-amber-100 dark:border-amber-900/30',
    rose: 'border-rose-100 dark:border-rose-900/30'
  };

  const buttonColors = {
    purple: 'bg-purple-600 hover:bg-purple-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    amber: 'bg-amber-500 hover:bg-amber-600',
    rose: 'bg-rose-600 hover:bg-rose-700'
  };

  return (
    <div className={cn(
      "p-6 bg-card rounded-3xl border space-y-4 flex flex-col justify-between h-full",
      borderColors[themeColor]
    )}>
      <div className="space-y-1">
        <h4 className="font-black text-foreground text-sm uppercase tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      <Button 
        onClick={onClick} 
        disabled={loading}
        className={cn(
          "w-full text-primary-foreground rounded-xl h-10 font-black text-[10px] uppercase tracking-widest shadow-lg transition-all",
          buttonColors[themeColor]
        )}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Icon size={16} className="mr-2" />}
        {buttonText}
      </Button>
    </div>
  );
};

export default SettingsActionCard;