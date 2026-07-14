import { useState, useMemo } from "react";
import { GitBranch, Target, Eye, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import CogsAssessment from "@/components/crm/CogsAssessment";
import PathwayFindingsList from "@/components/crm/PathwayFindingsList";
import { AppointmentWithClient } from "@/types/crm";
import { safeParse } from "@/utils/safe-json";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PhaseProps {
  appointment: AppointmentWithClient;
  history: any[];
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | 'Hypertonic' | null, side?: 'L' | 'R') => Promise<void>;
}

const CATEGORY_LABELS: Record<string, string> = {
  primitiveReflexes: 'Primitive Reflex',
  cranialNerves: 'Cranial Nerve',
  muscles: 'Muscle',
  brainZones: 'Brain Zone',
};

const CATEGORY_ICONS: Record<string, string> = {
  primitiveReflexes: '🧠',
  cranialNerves: '⚡',
  muscles: '💪',
  brainZones: '🎯',
};

const AlignPhase = ({ appointment, onUpdate, saveField, updatePriorityPattern }: PhaseProps) => {
  const pattern = safeParse(appointment.priority_pattern, {} as any);

  // Extract all inhibited/hypertonic findings into a flat list
  const findings = useMemo(() => {
    const items: { name: string; category: string; status: string; side?: 'L' | 'R' }[] = [];
    Object.entries(pattern).forEach(([catKey, categoryItems]: [string, any]) => {
      Object.entries(categoryItems).forEach(([name, status]) => {
        if (status === 'Inhibited' || status === 'Inhibition' || status === 'Hypertonic') {
          const sideMatch = name.match(/\(([LR])\)$/);
          const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
          const baseName = name.replace(/ \([LR]\)$/, '');
          items.push({ name: baseName, category: catKey, status: status as string, side });
        }
      });
    });
    return items;
  }, [pattern]);

  const inhibitedCount = findings.length;

  // Track which finding is set as the priority correction
  const priorityCorrection = appointment.modes_balances || "";

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
          <GitBranch size={24} />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Align</h2>
          <p className="text-sm text-muted-foreground font-medium max-w-2xl leading-relaxed">
            Review what you found in Preliminary and choose the priority correction to work on.
          </p>
        </div>
      </div>

      {/* COGS */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b border-border">
          <Eye size={16} className="text-muted-foreground" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">COGS — Visual Assessment</h3>
        </div>
        <CogsAssessment
          appointmentId={appointment.id}
          initialSagittalNotes={appointment.sagittal_plane_notes}
          initialFrontalNotes={appointment.frontal_plane_notes}
          initialTransverseNotes={appointment.transverse_plane_notes}
          onUpdate={onUpdate}
        />
      </div>

      {/* Inhibited Findings List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target size={16} className="text-muted-foreground" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Inhibited Findings</h3>
          </div>
          <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider">
            {inhibitedCount} Active
          </Badge>
        </div>

        {inhibitedCount > 0 ? (
          <div className="divide-y divide-border border border-border rounded-lg">
            {findings.map((item, i) => (
              <div key={`${item.category}-${item.name}-${item.side || ''}`} className="flex items-center justify-between gap-4 py-3 px-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg shrink-0">{CATEGORY_ICONS[item.category] || '•'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {item.name}
                      {item.side && <span className="text-muted-foreground ml-1">({item.side})</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {CATEGORY_LABELS[item.category] || item.category} · {item.status}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10 rounded-lg"
                  onClick={() => saveField('modes_balances', `${item.name}${item.side ? ` (${item.side})` : ''} — ${CATEGORY_LABELS[item.category] || item.category}`)}
                >
                  Set 1°
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
            <AlertCircle size={24} className="text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-medium">No inhibited findings yet. Complete assessments in Preliminary first.</p>
          </div>
        )}
      </div>

      {/* Priority Correction */}
      {priorityCorrection && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3">
          <Target size={18} className="text-primary shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Priority Correction</p>
            <p className="text-sm font-semibold text-foreground">{priorityCorrection}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-[10px] text-muted-foreground hover:bg-muted rounded-lg"
            onClick={() => saveField('modes_balances', '')}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
};

export default AlignPhase;