
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface IntegrationStatusProps {
  name: string;
  icon: LucideIcon;
  description: string;
  status?: string;
}

const IntegrationStatus = ({ name, icon: Icon, description, status = "Connected" }: IntegrationStatusProps) => {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center text-primary">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-black text-foreground">{name}</p>
          <p className="text-[10px] text-muted-foreground font-medium">{description}</p>
        </div>
      </div>
      <Badge className={cn(
        "border-none font-black text-[8px] uppercase tracking-widest",
        status === "Connected"
          ? "bg-emerald-500 text-white"
          : "bg-amber-500 text-white"
      )}>
        {status}
      </Badge>
    </div>
  );
};

export default IntegrationStatus;
