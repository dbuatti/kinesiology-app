import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  label?: string;
  className?: string;
}

export const PageLoader = ({ label = "Loading...", className = "" }: PageLoaderProps) => (
  <div className={`flex flex-col items-center justify-center py-24 gap-3 ${className}`}>
    <Loader2 size={32} className="animate-spin text-primary" />
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
  </div>
);
