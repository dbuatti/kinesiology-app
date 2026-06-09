
import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

const EmptyState = ({ icon: Icon, title, description, action, className }: EmptyStateProps) => (
  <div className={cn("flex flex-col items-center justify-center py-16 px-8 text-center", className)}>
    {Icon && (
      <div className="w-16 h-16 rounded-[2rem] bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/50" />
      </div>
    )}
    <h3 className="text-lg font-black text-foreground mb-1">{title}</h3>
    {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
  </div>
);

export default EmptyState;
