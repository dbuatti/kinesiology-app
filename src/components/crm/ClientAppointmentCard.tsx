import { useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowRight, Calendar, ChevronDown, Clock, LayoutGrid, Loader2, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types/crm";
import type { ClientGridData } from "@/hooks/useClientGridData";
import { GridSessionChips } from "./GridSessionChips";
import PathwayReflexStimGridSummary from "./PathwayReflexStimGridSummary";

interface ClientAppointmentCardProps {
  app: Appointment;
  grid?: ClientGridData;
  showTag?: boolean;
  generatingLink: string | null;
  onGeneratePaymentLink: (e: MouseEvent, app: Appointment) => void;
}

export const ClientAppointmentCard = ({
  app,
  grid,
  showTag,
  generatingLink,
  onGeneratePaymentLink,
}: ClientAppointmentCardProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group">
      <Card className="hover:shadow-md transition-all border-border bg-card group rounded-xl overflow-hidden">
        <Link to={`/appointments/${app.id}`} className="block no-underline">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="secondary" className="font-medium bg-muted text-muted-foreground">
                    {app.display_id || app.id.slice(0, 8)}
                  </Badge>
                  <span className="font-medium text-lg text-foreground group-hover:text-chart-primary transition-colors">
                    {app.name || format(app.date, "MMM d, yyyy")}
                  </span>
                  {showTag && <Badge className="bg-muted text-chart-primary hover:bg-muted border-none">{app.tag}</Badge>}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-chart-primary" /> {format(app.date, showTag ? "EEEE, MMM d" : "MMM d")}
                  </span>
                  {showTag && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-chart-primary" /> {format(app.date, "h:mm a")}
                    </span>
                  )}
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    app.status === 'Completed' ? "bg-muted text-chart-emerald" : "bg-muted text-muted-foreground"
                  )}>
                    {app.status}
                  </span>
                  {app.is_paid && !app.payment_received && (
                    <Badge className="bg-muted text-muted-foreground border-none font-semibold text-[10px] uppercase tracking-wider">
                      Payment Due
                    </Badge>
                  )}
                </div>
                <GridSessionChips grid={grid} />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(v => !v); }}
                  className={cn(
                    "h-9 px-3 rounded-xl text-[10px] font-semibold uppercase tracking-wider border-border text-muted-foreground",
                    expanded && "bg-primary text-primary-foreground border-primary"
                  )}
                  title="Show this session's grid summary (reflexes, stims, and nerve inhibitions)"
                >
                  <LayoutGrid size={13} className="mr-1.5" />
                  Grid Summary
                  {grid?.activeCount ? ` · ${grid.activeCount}` : ""}
                  <ChevronDown size={13} className={cn("ml-1 transition-transform", expanded && "rotate-180")} />
                </Button>
                {app.is_paid && !app.payment_received && (
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-9 px-4 font-semibold text-[10px] uppercase tracking-wider shadow-sm"
                    onClick={(e) => onGeneratePaymentLink(e, app)}
                    disabled={generatingLink === app.id}
                  >
                    {generatingLink === app.id ? <Loader2 size={14} className="animate-spin mr-2" /> : <QrCode size={14} className="mr-2" />}
                    Generate Link
                  </Button>
                )}
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground/60 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </CardContent>
        </Link>

        {expanded && (
          <div className="px-6 pb-6">
            <PathwayReflexStimGridSummary checked={grid?.checked ?? {}} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default ClientAppointmentCard;
