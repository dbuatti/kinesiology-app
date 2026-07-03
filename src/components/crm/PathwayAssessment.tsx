
import { useState, useMemo } from 'react';
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { 
  Brain, Zap, Activity, Dumbbell, Layers, ImageIcon, Baby, 
  Trash2, RefreshCw, Search, ListChecks 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Nuclei } from '@/utils/brainstem-logic';
import { showSuccess, showError } from "@/utils/toast";
import { safeParse } from '@/utils/safe-json';

// Assessment Components
import { CranialNerveAssessment } from "./CranialNerveAssessment";
import { PrimitiveReflexAssessment } from "./PrimitiveReflexAssessment";
import { BrainZoneAssessment } from "./BrainZoneAssessment";
import { MuscleAssessment } from "./MuscleAssessment";
import AssessmentSection from "./pathway/AssessmentSection";

type Status = 'Clear' | 'Inhibited';

interface PathwayAssessmentProps {
  appointmentId: string;
  initialValue?: string;
  previousValue?: string;
  history?: any[];
  onSave: (summary: string) => void;
  onUpdateItem: (category: string, item: string, status: Status | null, side?: 'L' | 'R') => Promise<void>;
  onJumpToCalibrate?: (itemName: string) => void;
  nucleiFilter?: Nuclei | null;
}

const PathwayAssessment = ({ 
  appointmentId,
  initialValue, 
  previousValue, 
  onSave, 
  onUpdateItem, 
  onJumpToCalibrate, 
  nucleiFilter 
}: PathwayAssessmentProps) => {
  const results = useMemo(() => safeParse(initialValue, {} as Record<string, Record<string, Status>>), [initialValue]);
  const [showImages, setShowImages] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    callback: () => void;
    title: string;
    description: string;
  } | null>(null);

  const handleClearAll = async () => {
    onSave("");
    showSuccess("All findings cleared.");
  };

  const handleSyncPrevious = async () => {
    if (!previousValue) return;
    
    try {
      const prev = safeParse(previousValue, {} as any);
      for (const [category, items] of Object.entries(prev)) {
        for (const [name, status] of Object.entries(items as any)) {
          if (status === 'Inhibited') {
            const sideMatch = name.match(/\(([LR])\)$/);
            const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
            const baseName = name.replace(/ \([LR]\)$/, '');
            await onUpdateItem(category, baseName, 'Inhibited', side);
          }
        }
      }
      showSuccess("Synced unresolved findings.");
    } catch (e) {
      showError("Failed to sync previous session data.");
    }
  };

  const getCounts = (category: string) => {
    const categoryResults = results[category] || {};
    const count = Object.keys(categoryResults).length;
    const inhibitedCount = Object.values(categoryResults).filter(s => s === 'Inhibited').length;
    return { count, inhibitedCount };
  };

  const inhibitedSummary = useMemo(() => {
    const summary: { name: string; category: string; catKey: string }[] = [];
    Object.entries(results).forEach(([catKey, items]) => {
      Object.entries(items).forEach(([name, status]) => {
        if (status === 'Inhibited') {
          summary.push({ 
            name, 
            category: catKey.replace(/([A-Z])/g, ' $1').trim(),
            catKey
          });
        }
      });
    });
    return summary;
  }, [results]);

  const fractalAlert = useMemo(() => {
    const inhibited = results.primitiveReflexes || {};
    if (inhibited['Fear Paralysis'] === 'Inhibited') {
      return { title: "Fear Paralysis Active", desc: "This is the Master Reflex. It is likely driving Moro and Startle. Clear this first to potentially resolve the whole chain." };
    }
    if (inhibited['Moro Reflex'] === 'Inhibited' || inhibited['Moro Reflex (L)'] === 'Inhibited' || inhibited['Moro Reflex (R)'] === 'Inhibited') {
      return { title: "Moro Reflex Active", desc: "Moro is tied to TLR, ATNR, and STNR. Check these for automatic resolution after correcting Moro." };
    }
    return null;
  }, [results.primitiveReflexes]);

  const totalFindings = Object.values(results).reduce((acc, curr) => acc + Object.keys(curr).length, 0);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-40 space-y-4 bg-background/80 backdrop-blur-md pb-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted rounded-xl border border-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 border-r border-border">
              <Layers size={18} className="text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Session View</span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch id="show-images" checked={showImages} onCheckedChange={setShowImages} />
                <Label htmlFor="show-images" className="text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer flex items-center gap-2">
                  <ImageIcon size={14} className="text-muted-foreground" />
                  Reference Images
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="compact-mode" checked={compactMode} onCheckedChange={setCompactMode} />
                <Label htmlFor="compact-mode" className="text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer flex items-center gap-2">
                  <ListChecks size={14} className="text-muted-foreground" />
                  Compact
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {previousValue && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setConfirmAction({
                  callback: handleSyncPrevious,
                  title: "Sync unresolved findings?",
                  description: "This will copy unresolved findings from the previous session."
                })}
                className="h-9 text-[10px] font-medium uppercase tracking-wider hover:bg-muted"
              >
                <RefreshCw size={14} className="mr-2" /> Sync Unresolved
              </Button>
            )}
            {nucleiFilter && (
              <Badge className="bg-primary text-primary-foreground border-none font-medium text-[10px] px-3 py-1 rounded-full">
                Filter: {nucleiFilter}
              </Badge>
            )}
            {totalFindings > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setConfirmAction({
                  callback: handleClearAll,
                  title: "Clear all findings?",
                  description: "This will remove all assessment findings for this session."
                })}
                className="h-9 font-medium text-[10px] text-destructive hover:bg-destructive/10 rounded-xl border border-border"
              >
                <Trash2 size={14} className="mr-2" /> Clear All
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'primitive', label: 'Reflexes', icon: Baby, count: getCounts('primitiveReflexes').inhibitedCount, color: 'text-chart-primary' },
            { id: 'cranial', label: 'Nerves', icon: Zap, count: getCounts('cranialNerves').inhibitedCount, color: 'text-chart-destructive' },
            { id: 'brain', label: 'Zones', icon: Brain, count: getCounts('brainZones').inhibitedCount, color: 'text-chart-primary' },
            { id: 'muscles', label: 'Muscles', icon: Dumbbell, count: getCounts('muscles').inhibitedCount, color: 'text-chart-emerald' },
          ].map((cat) => (
            <Button
              key={cat.id}
              variant="outline"
              onClick={() => scrollToSection(cat.id)}
              className="rounded-2xl h-12 px-6 bg-card border-border hover:bg-accent transition-all group shrink-0"
            >
              <cat.icon size={18} className={cn("mr-3 transition-transform group-hover:scale-110", cat.color)} />
              <span className="font-medium text-[10px] uppercase tracking-wider mr-3">{cat.label}</span>
              {cat.count > 0 && (
                <Badge className="bg-chart-destructive text-destructive-foreground border-none font-medium text-[10px] h-5 min-w-[20px] flex items-center justify-center px-1 rounded-full">
                  {cat.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {fractalAlert && (
        <Alert className="bg-primary text-primary-foreground border-none rounded-xl shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={80} /></div>
          <Zap className="h-5 w-5 text-muted-foreground" />
          <AlertDescription className="text-sm font-medium leading-relaxed relative z-10">
            <span className="text-muted-foreground font-medium text-[10px] block mb-1">Fractal Logic Detected</span>
            <strong>{fractalAlert.title}:</strong> {fractalAlert.desc}
          </AlertDescription>
        </Alert>
      )}

      {inhibitedSummary.length > 0 && (
        <Card className="rounded-xl bg-card border border-border shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-3 text-foreground">
                <Zap size={24} className="text-chart-destructive" /> Priority Findings
              </CardTitle>
              <Badge className="bg-chart-destructive/10 text-chart-destructive border-none font-medium text-[10px] px-3 py-1 rounded-full">
                {inhibitedSummary.length} Active
              </Badge>
            </div>
            <CardDescription className="text-muted-foreground font-medium">Findings requiring calibration in this session.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {inhibitedSummary.map((item, idx) => (
                <div key={idx} className="p-4 bg-card rounded-xl border border-border flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
                    <p className="text-[10px] font-medium text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-muted"
                      onClick={() => onJumpToCalibrate?.(item.name)}
                    >
                      <Zap size={16} className="fill-current" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-xl text-chart-emerald hover:bg-muted"
                      onClick={() => onUpdateItem(item.catKey, item.name, 'Clear')}
                    >
                      <RefreshCw size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AssessmentSection 
        id="primitive"
        title="Primitive Reflex Assessment" 
        description="Check foundational movement patterns." 
        icon={Baby} 
        {...getCounts('primitiveReflexes')}
      >
        <PrimitiveReflexAssessment 
          appointmentId={appointmentId} 
          priorityPattern={initialValue}
          updatePriorityPattern={onUpdateItem}
          compactMode={compactMode}
        />
      </AssessmentSection>

      <AssessmentSection 
        id="cranial"
        title="Cranial Nerve Assessment" 
        description="Test direct pathways from the brainstem." 
        icon={Activity} 
        {...getCounts('cranialNerves')}
      >
        <CranialNerveAssessment 
          appointmentId={appointmentId} 
          priorityPattern={initialValue}
          updatePriorityPattern={onUpdateItem}
          showImages={showImages}
          compactMode={compactMode}
        />
      </AssessmentSection>

      <AssessmentSection 
        id="brain"
        title="Brain Zone Assessment" 
        description="Challenge specific cortical and subcortical regions." 
        icon={Brain} 
        {...getCounts('brainZones')}
      >
        <BrainZoneAssessment 
          priorityPattern={initialValue}
          updatePriorityPattern={onUpdateItem}
          showImages={showImages}
          compactMode={compactMode}
        />
      </AssessmentSection>

      <AssessmentSection 
        id="muscles" 
        title="Muscle Assessment" 
        description="Log individual muscle facilitation/inhibition." 
        icon={Dumbbell} 
        {...getCounts('muscles')}
      >
        <MuscleAssessment 
          priorityPattern={initialValue}
          updatePriorityPattern={onUpdateItem}
          showImages={showImages}
          compactMode={compactMode}
        />
      </AssessmentSection>
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title={confirmAction?.title || ""}
        description={confirmAction?.description || ""}
        confirmLabel="Confirm"
        onConfirm={() => {
          confirmAction?.callback();
          setConfirmAction(null);
        }}
      />
    </div>
  );
};

export default PathwayAssessment;