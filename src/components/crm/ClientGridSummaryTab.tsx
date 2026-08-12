import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown, LayoutGrid, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types/crm";
import PathwayReflexStimGridSummary from "@/components/crm/PathwayReflexStimGridSummary";
import type { ClientGridData } from "@/hooks/useClientGridData";

interface ClientGridSummaryTabProps {
  clientName: string;
  appointments: Appointment[];
  gridFor: Record<string, ClientGridData>;
}

export const ClientGridSummaryTab = ({ clientName, appointments, gridFor }: ClientGridSummaryTabProps) => {
  const navigate = useNavigate();
  const [expandedGrid, setExpandedGrid] = useState<string | null>(null);

  const gridApps = appointments.filter(a => (gridFor[a.id]?.activeCount || 0) > 0);
  const emptyApps = appointments.filter(a => !((gridFor[a.id]?.activeCount || 0) > 0));
  const totalMarks = gridApps.reduce((acc, a) => acc + (gridFor[a.id]?.activeCount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-chart-primary/10 via-transparent to-transparent p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-chart-primary/10 flex items-center justify-center text-chart-primary shrink-0">
            <LayoutGrid size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Pathway / Reflex / Stim Grid</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Every marked reflex, stim, nerve inhibition, and intrinsic muscle tone captured across {clientName}'s sessions.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <p className="text-2xl font-black text-chart-primary tabular-nums leading-none">{gridApps.length}</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Marked Sessions</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-black text-chart-destructive tabular-nums leading-none">{totalMarks}</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Total Marks</p>
            </div>
          </div>
        </div>

        {gridApps.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/40 mb-4">
              <LayoutGrid size={28} />
            </div>
            <p className="text-sm font-medium text-foreground">No grid marks yet.</p>
            <p className="mt-1 text-xs text-muted-foreground/70 max-w-sm mx-auto">
              Marks are captured during sessions in the pathway grid — inhibited reflexes, tested stims, nerve-level inhibition, and intrinsic muscle tone. They'll appear here as a timeline.
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-5">
            {gridApps.map(app => {
              const g = gridFor[app.id];
              const isOpen = expandedGrid === app.id;
              return (
                <div key={app.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedGrid(isOpen ? null : app.id)}
                    className="w-full flex items-center justify-between gap-4 p-4 hover:bg-muted/40 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Calendar size={16} className="text-chart-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{app.name || format(app.date, "EEEE, MMMM d, yyyy")}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {format(app.date, "MMMM d, yyyy")} · {app.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="hidden lg:flex items-center gap-3">
                        {g.tracks.map(t => (
                          <span key={t.title} className="flex items-center gap-1.5" title={t.title}>
                            <span className={cn("h-2.5 w-2.5 rounded-full", t.color)} />
                            <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{t.count}</span>
                          </span>
                        ))}
                        {g.tracks.length > 0 && g.nuclei.length > 0 && <span className="h-4 w-px bg-border" />}
                        {g.nuclei.map(n => (
                          <span key={n.label} className="flex items-center gap-1.5" title={`${n.label} nuclei`}>
                            <span className={cn("h-2.5 w-2.5 rounded-full", n.color)} />
                            <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{n.count}</span>
                          </span>
                        ))}
                        {g.muscleCount > 0 && (
                          <>
                            {(g.tracks.length > 0 || g.nuclei.length > 0) && <span className="h-4 w-px bg-border" />}
                            <span className="flex items-center gap-1.5" title="Intrinsic muscles with tone findings">
                              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                              <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{g.muscleCount}</span>
                            </span>
                          </>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-black text-chart-primary tabular-nums leading-none">{g.activeCount}</p>
                        <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">marked</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider border-border"
                          onClick={(e) => { e.stopPropagation(); navigate(`/appointments/${app.id}/grid-sheet`); }}
                          title="Printable grid sheet for this session"
                        >
                          <Printer size={12} className="mr-1" /> Sheet
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider"
                          onClick={(e) => { e.stopPropagation(); navigate(`/appointments/${app.id}`); }}
                          title="Open this session"
                        >
                          Session
                        </Button>
                        <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-2 border-t border-border/50">
                      <PathwayReflexStimGridSummary checked={g.checked} muscleState={g.muscleState} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {emptyApps.length > 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Sessions without grid marks ({emptyApps.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {emptyApps.map(app => (
              <button
                key={app.id}
                type="button"
                onClick={() => navigate(`/appointments/${app.id}`)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-chart-primary/40 transition-colors cursor-pointer"
                title="Open this session"
              >
                {format(app.date, "MMM d, yyyy")}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientGridSummaryTab;
