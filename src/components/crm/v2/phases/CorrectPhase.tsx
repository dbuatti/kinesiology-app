import { useState, useMemo, useEffect } from "react";
import { Target, Activity, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EditableField from "@/components/shared/EditableField";
import PathwayLogicWizard from "@/components/crm/PathwayLogicWizard";
import { PhaseHeader } from "@/components/crm/v2/PhaseComponents";
import { CATEGORY_LABELS } from "@/components/crm/v2/categoryConstants";
import { safeParse } from "@/utils/safe-json";
import type { PhaseProps } from "@/components/crm/v2/v2-types";

const CorrectPhase = ({ appointment, onUpdate, saveField }: PhaseProps) => {
  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [customPathway, setCustomPathway] = useState("");

  const meta = useMemo(() => {
    if (!appointment.metadata) return {};
    if (typeof appointment.metadata === 'string') return safeParse(appointment.metadata, {});
    return appointment.metadata;
  }, [appointment.metadata]);

  const priorityPathway = (meta as any)?.priority_pathway || "";
  const isCustom = priorityPathway === 'CUSTOM';

  useEffect(() => {
    if (priorityPathway && priorityPathway !== 'CUSTOM') {
      setCustomPathway(priorityPathway);
    }
  }, [priorityPathway]);

  const pattern = safeParse(appointment.priority_pattern, {} as any);
  const pathwayFindings = useMemo(() => {
    const items: { value: string; label: string; category: string }[] = [];
    Object.entries(pattern).forEach(([catKey, categoryItems]: [string, any]) => {
      Object.entries(categoryItems).forEach(([name, status]) => {
        if (status === 'Inhibited' || status === 'Inhibition' || status === 'Hypertonic') {
          const sideMatch = name.match(/\(([LR])\)$/);
          const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
          const baseName = name.replace(/ \([LR]\)$/, '');
          const catLabel = CATEGORY_LABELS[catKey] || catKey;
          const val = `${baseName}${side ? ` (${side})` : ''} — ${catLabel}`;
          items.push({ value: val, label: val, category: catKey });
        }
      });
    });
    return items;
  }, [pattern]);

  const initialFinding = useMemo(() => {
    if (!priorityPathway) return undefined;
    return priorityPathway.split(' — ')[0];
  }, [priorityPathway]);

  return (
    <div className="space-y-10">
      <PhaseHeader icon={Target} title="Correct" description="Determine afferent vs efferent, identify coordinates, and apply the correction." />

      {/* Priority Pathway Banner */}
      {priorityPathway && (
        <div className="flex items-center gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <Target size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold text-destructive uppercase tracking-wider">Priority Pathway</p>
            <p className="text-sm font-semibold text-foreground truncate">{priorityPathway}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPathModalOpen(true)}
            className="rounded-lg h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10"
          >
            <Info size={16} />
          </Button>
        </div>
      )}

      <div>
        {/* Inhibition/Hypertonic Finding Selector */}
        {pathwayFindings.length > 0 && (
          <div className="mb-4 p-3 bg-muted/50 rounded-xl border border-border">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Select Finding to Correct</p>
            <Select
              value={priorityPathway || ''}
              onValueChange={async (val) => {
                await saveField('metadata', { ...meta, priority_pathway: val });
                onUpdate();
              }}
            >
              <SelectTrigger className="w-full h-10 rounded-lg border-border text-xs">
                <SelectValue placeholder="Choose an inhibited finding..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border max-h-[200px]">
                {pathwayFindings.map(f => (
                  <SelectItem key={f.value} value={f.value} className="rounded-lg py-2 text-xs font-medium">
                    {f.label}
                  </SelectItem>
                ))}
                <SelectItem value="CUSTOM" className="rounded-lg py-2 text-xs font-medium text-chart-primary">
                  <Plus size={12} className="mr-1.5 inline" /> Custom Entry
                </SelectItem>
              </SelectContent>
            </Select>
            {priorityPathway === 'CUSTOM' && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={customPathway}
                  onChange={e => setCustomPathway(e.target.value)}
                  placeholder="e.g. Startle Reflex — Primitive Reflex"
                  className="h-9 rounded-lg text-xs"
                  autoFocus
                />
                <Button
                  size="sm"
                  disabled={!customPathway.trim()}
                  onClick={async () => {
                    await saveField('metadata', { ...meta, priority_pathway: customPathway.trim() });
                    onUpdate();
                  }}
                  className="rounded-lg h-9 px-3 text-xs font-medium"
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        )}

        <PathwayLogicWizard
          onSave={async (summary) => {
            await saveField('modes_balances', summary);
            if (priorityPathway && summary) {
              const corrections = [...((meta as any)?.corrections || [])];
              corrections.push({
                pathway: priorityPathway,
                summary,
                timestamp: new Date().toISOString(),
              });
              await saveField('metadata', { ...meta, corrections });
              onUpdate();
            }
          }}
          onClearItem={() => onUpdate()}
          priorityPattern={appointment.priority_pattern}
          initialFinding={initialFinding}
          appointmentId={appointment.id}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <Target size={18} className="text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground tracking-tight">Corrections & Balances Applied</h3>
        </div>
        <EditableField
          field="modes_balances"
          label=""
          value={appointment.modes_balances}
          multiline
          placeholder="Document the coordinates, polarity, and methods applied..."
          onSave={saveField}
          className="bg-card border border-border p-6 rounded-xl shadow-sm min-h-[200px]"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <Activity size={18} className="text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground tracking-tight">Acupoints</h3>
        </div>
        <EditableField
          field="acupoints"
          label=""
          value={appointment.acupoints}
          multiline
          placeholder="Record any acupressure points held..."
          onSave={saveField}
          className="bg-card border border-border p-6 rounded-xl shadow-sm min-h-[120px]"
        />
      </div>

      {/* Priority Pathway Modal */}
      <Dialog open={pathModalOpen} onOpenChange={setPathModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target size={18} className="text-destructive" /> Priority Pathway
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Correction Target</p>
              <Select
                value={priorityPathway}
                onValueChange={async (val) => {
                  setCustomPathway("");
                  await saveField('metadata', { ...meta, priority_pathway: val });
                  onUpdate();
                }}
              >
                <SelectTrigger className="w-full h-12 rounded-xl border-border">
                  <SelectValue placeholder="Select the priority finding..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  {pathwayFindings.map(f => (
                    <SelectItem key={f.value} value={f.value} className="rounded-lg py-2.5 font-medium">
                      {f.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="CUSTOM" className="rounded-lg py-2.5 font-medium text-chart-primary">
                    <Plus size={14} className="mr-2 inline" /> Custom Entry
                  </SelectItem>
                </SelectContent>
              </Select>
              {isCustom && (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={customPathway}
                    onChange={e => setCustomPathway(e.target.value)}
                    placeholder="e.g. Startle Reflex — Primitive Reflex"
                    className="h-10 rounded-xl text-sm"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    disabled={!customPathway.trim()}
                    onClick={async () => {
                      await saveField('metadata', { ...meta, priority_pathway: customPathway.trim() });
                      onUpdate();
                    }}
                    className="rounded-xl h-10 px-4 text-xs font-medium"
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
            {priorityPathway && priorityPathway !== 'CUSTOM' && (
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-xl border border-border space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Priority Pathway</p>
                  <p className="text-sm font-semibold text-foreground">{priorityPathway}</p>
                </div>
                {(() => {
                  const pathwayCorrections = ((meta as any)?.corrections || []).filter(
                    (c: any) => c.pathway === priorityPathway
                  );
                  if (pathwayCorrections.length === 0 && appointment.modes_balances) {
                    pathwayCorrections.push({
                      pathway: priorityPathway,
                      summary: appointment.modes_balances,
                    });
                  }
                  return pathwayCorrections.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                        Corrections Linked to {priorityPathway}
                      </p>
                      {pathwayCorrections.map((c: any, i: number) => (
                        <div key={i} className="p-4 bg-muted border border-border rounded-xl space-y-2">
                          {pathwayCorrections.length > 1 && (
                            <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                              Correction #{i + 1}
                            </p>
                          )}
                          <p className="text-sm font-medium text-foreground leading-relaxed">{c.summary}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                            Linked to {c.pathway}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CorrectPhase;
