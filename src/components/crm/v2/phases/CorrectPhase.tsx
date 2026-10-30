import { useState, useMemo, useEffect } from "react";
import { Target, Activity, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EditableField from "@/components/shared/EditableField";
import PathwayLogicWizard from "@/components/crm/PathwayLogicWizard";
import { PhaseHeader, PhasePanel, SectionHeading, PathwayBanner } from "@/components/crm/v2/PhaseComponents";
import { getInhibitedFindings, findingLabel } from "@/components/crm/v2/v2-utils";
import { safeParse } from "@/utils/safe-json";
import type { PhaseProps } from "@/components/crm/v2/v2-types";

const CorrectPhase = ({ appointment, onUpdate, saveField }: PhaseProps) => {
  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [customPathway, setCustomPathway] = useState("");
  const [customMode, setCustomMode] = useState(false);

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

  const pathwayFindings = useMemo(() => {
    return getInhibitedFindings(appointment.priority_pattern).map(f => ({
      value: findingLabel(f.catKey, f.baseName, f.side, f.status),
      category: f.catKey,
    }));
  }, [appointment.priority_pattern]);

  const initialFinding = useMemo(() => {
    if (!priorityPathway) return undefined;
    return priorityPathway.split(' — ')[0];
  }, [priorityPathway]);

  const selectPathway = async (val: string) => {
    if (val === 'CUSTOM') {
      setCustomMode(true);
      return;
    }
    setCustomMode(false);
    await saveField('metadata', { ...meta, priority_pathway: val });
    onUpdate();
  };

  const saveCustom = async () => {
    if (!customPathway.trim()) return;
    setCustomMode(false);
    await saveField('metadata', { ...meta, priority_pathway: customPathway.trim() });
    onUpdate();
  };

  return (
    <div className="space-y-5">
      <PhaseHeader icon={Target} title="Correct" description="Determine afferent vs efferent, identify coordinates, and apply the correction." />

      {/* Priority pathway — same object, same treatment as Align. */}
      {priorityPathway && priorityPathway !== 'CUSTOM' && (
        <PathwayBanner
          icon={Target}
          value={priorityPathway}
          actions={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPathModalOpen(true)}
                className="h-8 rounded-lg px-2.5 text-[11px] font-medium text-muted-foreground hover:bg-background/60"
              >
                Change
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPathModalOpen(true)}
                aria-label="Priority pathway details"
                className="h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-background/60"
              >
                <Info size={15} />
              </Button>
            </>
          }
        />
      )}

      <div className="space-y-4">
        {/* Inhibition/Hypertonic Finding Selector (hidden once a real pathway is set) */}
        {pathwayFindings.length > 0 && (!priorityPathway || isCustom || customMode) && (
          <PhasePanel className="space-y-3">
            <SectionHeading icon={Target} title="Select finding to correct" />
            <Select
              value={priorityPathway && priorityPathway !== 'CUSTOM' ? priorityPathway : ''}
              onValueChange={selectPathway}
            >
              <SelectTrigger className="h-10 w-full rounded-lg border-border text-xs">
                <SelectValue placeholder="Choose an inhibited finding..." />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] rounded-xl border-border">
                {pathwayFindings.map(f => (
                  <SelectItem key={f.value} value={f.value} className="rounded-lg py-2 text-xs font-medium">
                    {f.value}
                  </SelectItem>
                ))}
                <SelectItem value="CUSTOM" className="rounded-lg py-2 text-xs font-medium text-chart-primary">
                  <Plus size={12} className="mr-1.5 inline" /> Custom Entry
                </SelectItem>
              </SelectContent>
            </Select>
            {(isCustom || customMode) && (
              <div className="flex items-center gap-2">
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
                  onClick={saveCustom}
                  className="h-9 rounded-lg px-3 text-xs font-medium"
                >
                  Save
                </Button>
              </div>
            )}
          </PhasePanel>
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

      <PhasePanel className="space-y-3">
        <SectionHeading
          icon={Target}
          title="Corrections & balances applied"
          hint="Coordinates, polarity and method"
        />
        <EditableField
          field="modes_balances"
          label=""
          value={appointment.modes_balances}
          multiline
          placeholder="Document the coordinates, polarity, and methods applied..."
          onSave={saveField}
          className="min-h-[200px] rounded-xl border border-border/60 bg-background/50 p-4"
        />
      </PhasePanel>

      <PhasePanel className="space-y-3">
        <SectionHeading icon={Activity} title="Acupoints" hint="Any points held or needled" />
        <EditableField
          field="acupoints"
          label=""
          value={appointment.acupoints}
          multiline
          placeholder="Record any acupressure points held..."
          onSave={saveField}
          className="min-h-[120px] rounded-xl border border-border/60 bg-background/50 p-4"
        />
      </PhasePanel>

      {/* Priority Pathway Modal */}
      <Dialog open={pathModalOpen} onOpenChange={setPathModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target size={18} className="text-primary" /> Priority Pathway
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Correction Target</p>
              <Select
                value={priorityPathway && priorityPathway !== 'CUSTOM' ? priorityPathway : ''}
                onValueChange={(val) => {
                  setCustomPathway("");
                  selectPathway(val);
                }}
              >
                <SelectTrigger className="w-full h-12 rounded-xl border-border">
                  <SelectValue placeholder="Select the priority finding..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  {pathwayFindings.map(f => (
                    <SelectItem key={f.value} value={f.value} className="rounded-lg py-2.5 font-medium">
                      {f.value}
                    </SelectItem>
                  ))}
                  <SelectItem value="CUSTOM" className="rounded-lg py-2.5 font-medium text-chart-primary">
                    <Plus size={14} className="mr-2 inline" /> Custom Entry
                  </SelectItem>
                </SelectContent>
              </Select>
              {(isCustom || customMode) && (
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
                    onClick={saveCustom}
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
                  <p className="text-xs font-medium text-muted-foreground">Priority Pathway</p>
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
                      <p className="text-xs font-medium text-muted-foreground px-1">
                        Corrections Linked to {priorityPathway}
                      </p>
                      {pathwayCorrections.map((c: any, i: number) => (
                        <div key={i} className="p-4 bg-muted border border-border rounded-xl space-y-2">
                          {pathwayCorrections.length > 1 && (
                            <p className="text-xs font-medium text-muted-foreground">
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
