
import { useState, useEffect, useMemo, useRef } from "react";
import { CRANIAL_NERVES, CranialNerve } from "@/data/cranial-nerve-data";
import { useCranialNerveTests } from "@/hooks/useCranialNerveTests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ImageIcon, 
  Loader2, 
  Hand, 
  PlayCircle,
  FileText,
  CheckCircle2,
  ArrowRightLeft,
  Info,
  Search,
  Activity,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Stethoscope
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { safeParse } from "@/utils/safe-json";
import { CranialNerveTest } from "@/types/crm";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import StimResultsSummary from "@/components/crm/StimResultsSummary";

interface NerveTestItemProps {
  nerve: CranialNerve;
  test: Partial<CranialNerveTest>;
  statusL?: 'Clear' | 'Inhibited';
  statusR?: 'Clear' | 'Inhibited';
  statusMidline?: 'Clear' | 'Inhibited';
  isLateralized: boolean;
  images: { primary: string | null, secondary: string | null } | undefined;
  showImage: boolean;
  compact?: boolean;
  onUpdate: (nerveId: string, updates: Partial<CranialNerveTest>, side?: 'L' | 'R') => Promise<void>;
  onShowInfo?: (nerveId: number) => void;
}

const NerveTestItem = ({ nerve, test, statusL, statusR, statusMidline, isLateralized, images, showImage, compact, onUpdate, onShowInfo }: NerveTestItemProps) => {
  const [localNotes, setLocalNotes] = useState(test.notes || "");
  const [showDysfunction, setShowDysfunction] = useState(false);
  const [showProtocol, setShowProtocol] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (test.notes !== undefined && test.notes !== localNotes) {
      setLocalNotes(test.notes || "");
    }
  }, [test.notes]);

  const handleNotesChange = (val: string) => {
    setLocalNotes(val);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onUpdate(nerve.id.toString(), { notes: val });
    }, 1000);
  };

  const handleClear = async () => {
    if (isLateralized) {
      await onUpdate(nerve.id.toString(), { is_inhibited: false }, 'L');
      await onUpdate(nerve.id.toString(), { is_inhibited: false }, 'R');
    } else {
      await onUpdate(nerve.id.toString(), { is_inhibited: false });
    }
    await onUpdate(nerve.id.toString(), { 
      is_inhibited: false, 
      is_priority: false, 
      is_primary_priority: false 
    });
  };

  const handleBilateralToggle = async (checked: boolean) => {
    await onUpdate(nerve.id.toString(), { is_inhibited: checked }, 'L');
    await onUpdate(nerve.id.toString(), { is_inhibited: checked }, 'R');
  };

  const hasImages = images?.primary || images?.secondary;
  const isAnyInhibited = statusL === 'Inhibited' || statusR === 'Inhibited' || statusMidline === 'Inhibited' || test.is_inhibited;
  const isBilateral = statusL === 'Inhibited' && statusR === 'Inhibited';

  return (
    <section className={cn(
      "rounded-xl border transition-all",
      compact ? "p-2 space-y-1" : "space-y-2 p-4",
      test.is_primary_priority ? "bg-muted/30 border-indigo-200 ring-1 ring-indigo-100" : 
      test.is_priority ? "bg-muted/30 border-amber-200" : 
      !isAnyInhibited && (statusL === 'Clear' || statusR === 'Clear' || statusMidline === 'Clear') ? "bg-emerald-50/30 border-emerald-200" :
      "border-border bg-card"
    )}>
      <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-2", compact ? "pb-0" : "pb-2 border-b border-border/50")}>
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center gap-2 cursor-pointer group/title"
            onClick={() => onShowInfo?.(nerve.id)}
          >
            <h2 className="text-lg font-serif font-medium text-foreground group-hover/title:text-chart-primary transition-colors">
              {nerve.name}: {nerve.latinName}
            </h2>
            <Info size={14} className="text-muted-foreground/60 group-hover/title:text-chart-primary transition-colors" />
          </div>
          <Badge variant="outline" className="border-border text-muted-foreground font-medium text-[7px] uppercase tracking-wider px-1.5 py-0 rounded-none">
            {nerve.nuclei} • {nerve.toneEffect}
          </Badge>
          {!isAnyInhibited && (statusL === 'Clear' || statusR === 'Clear' || statusMidline === 'Clear') && (
            <Badge className="bg-emerald-100 text-emerald-700 border-none font-semibold text-[7px] uppercase tracking-wider px-1.5 py-0 rounded-none">
              <CheckCircle2 size={8} className="mr-0.5" /> Clear
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 print:hidden">
          <div className="flex items-center gap-3 border-r border-border pr-4">
            {isLateralized ? (
              <>
                <div className="flex items-center gap-1.5">
                  <Checkbox 
                    id={`inhib-l-${nerve.id}`}
                    checked={statusL === 'Inhibited'}
                    onCheckedChange={(checked) => onUpdate(nerve.id.toString(), { is_inhibited: !!checked }, 'L')}
                    className="h-3.5 w-3.5 border-border rounded-none"
                  />
                  <label htmlFor={`inhib-l-${nerve.id}`} className="text-[10px] font-medium uppercase tracking-wider cursor-pointer text-muted-foreground">
                    L Inhib
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Checkbox 
                    id={`inhib-r-${nerve.id}`}
                    checked={statusR === 'Inhibited'}
                    onCheckedChange={(checked) => onUpdate(nerve.id.toString(), { is_inhibited: !!checked }, 'R')}
                    className="h-3.5 w-3.5 border-border rounded-none"
                  />
                  <label htmlFor={`inhib-r-${nerve.id}`} className="text-[10px] font-medium uppercase tracking-wider cursor-pointer text-muted-foreground">
                    R Inhib
                  </label>
                </div>
                <div className="flex items-center gap-1.5 ml-1">
                  <Checkbox 
                    id={`inhib-both-${nerve.id}`}
                    checked={isBilateral}
                    onCheckedChange={(checked) => handleBilateralToggle(!!checked)}
                    className="h-3.5 w-3.5 border-primary rounded-none data-[state=checked]:bg-primary"
                  />
                  <label htmlFor={`inhib-both-${nerve.id}`} className="text-[10px] font-medium uppercase tracking-wider cursor-pointer text-chart-primary">
                    Both
                  </label>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Checkbox 
                  id={`inhib-mid-${nerve.id}`}
                  checked={statusMidline === 'Inhibited'}
                  onCheckedChange={(checked) => onUpdate(nerve.id.toString(), { is_inhibited: !!checked })}
                  className="h-3.5 w-3.5 border-border rounded-none"
                />
                <label htmlFor={`inhib-mid-${nerve.id}`} className="text-[10px] font-medium uppercase tracking-wider cursor-pointer text-muted-foreground">
                  Inhibited
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Checkbox 
                id={`priority-${nerve.id}`}
                checked={test.is_priority}
                onCheckedChange={(checked) => onUpdate(nerve.id.toString(), { is_priority: !!checked })}
                className="h-3.5 w-3.5 border-border rounded-none"
              />
              <label htmlFor={`priority-${nerve.id}`} className="text-[10px] font-medium uppercase tracking-wider cursor-pointer text-muted-foreground">
                Priority
              </label>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onUpdate(nerve.id.toString(), { is_primary_priority: !test.is_primary_priority })}
              className={cn(
                "h-5 px-2 text-[7px] font-medium uppercase tracking-wider transition-all rounded-md",
                test.is_primary_priority ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {test.is_primary_priority ? "Primary" : "Set 1°"}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClear}
              className="h-5 px-2 text-[7px] font-medium uppercase tracking-wider text-chart-emerald hover:bg-muted rounded-md"
            >
              <CheckCircle2 size={10} className="mr-1" /> Clear
            </Button>
          </div>
        </div>
      </div>

      <StimResultsSummary
        kind="nerve"
        nerve={nerve}
        stimResults={test.stim_results}
        className={cn(compact ? "pt-1.5 border-t border-border/50" : "pb-1")}
      />

      {!compact && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <Hand size={10} /> Reflex Point
                </div>
                <p className="text-xs font-medium text-foreground leading-tight">{nerve.reflexPoint}</p>
              </div>
              
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <PlayCircle size={10} /> Stimulus
                </div>
                <p className="text-xs font-medium text-foreground leading-tight">{nerve.stimulus}</p>
              </div>
            </div>

            {nerve.delineationGuide && (
              <div className="p-3 bg-muted/50 rounded-xl border border-border animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="flex items-center gap-2 mb-1.5">
                  <ArrowRightLeft size={12} className="text-chart-primary" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-chart-primary">Delineation Guide</span>
                </div>
                <p className="text-[10px] font-medium text-foreground leading-relaxed whitespace-pre-line">
                  {nerve.delineationGuide}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <FileText size={10} /> Notes
              </div>
              <textarea 
                value={localNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                className="w-full min-h-[40px] bg-muted/30 border-none rounded-lg p-2 text-xs font-medium focus:ring-1 focus:ring-primary transition-all resize-none"
                placeholder="Findings..."
              />
            </div>

            {(nerve.dysfunctionConsequences || nerve.assessmentProtocol) && (
              <div className="space-y-2 pt-2 border-t border-border/50 print:hidden">
                {nerve.dysfunctionConsequences && (
                  <>
                    <button
                      onClick={() => setShowDysfunction(!showDysfunction)}
                      className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showDysfunction ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                      <AlertTriangle size={10} className="text-destructive" />
                      Dysfunction Consequences
                    </button>
                    {showDysfunction && (
                      <div className="p-3 bg-destructive/5 rounded-xl border border-destructive/10 animate-in fade-in duration-200">
                        <p className="text-[10px] font-medium text-foreground/80 leading-relaxed whitespace-pre-line">
                          {nerve.dysfunctionConsequences}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {nerve.assessmentProtocol && (
                  <>
                    <button
                      onClick={() => setShowProtocol(!showProtocol)}
                      className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showProtocol ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                      <Stethoscope size={10} className="text-chart-primary" />
                      Assessment Protocol
                    </button>
                    {showProtocol && (
                      <div className="p-3 bg-chart-primary/5 rounded-xl border border-chart-primary/10 animate-in fade-in duration-200">
                        <p className="text-[10px] font-medium text-foreground/80 leading-relaxed whitespace-pre-line">
                          {nerve.assessmentProtocol}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            {showImage && hasImages ? (
              <div className="flex h-32 rounded-lg overflow-hidden border border-border">
                {images.primary && (
                  <div className="flex-1 bg-muted overflow-hidden">
                    <img src={images.primary} alt="Primary" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                  </div>
                )}
                {images.secondary && (
                  <div className="flex-1 bg-muted overflow-hidden">
                    <img src={images.secondary} alt="Secondary" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            ) : showImage && (
              <div className="h-full min-h-[60px] border border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground bg-muted/20">
                <ImageIcon size={16} className="opacity-10" />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

const NERVE_CLUSTERS = [
  { id: 'sensory', label: 'Sensory (I, II)', ids: [1, 2] },
  { id: 'eye-motor', label: 'Eye Motor (III, IV, V, VI)', ids: [3, 4, 5, 6] },
  { id: 'face', label: 'Face (VII, VIII)', ids: [7, 8] },
  { id: 'vagal-throat', label: 'Vagal & Throat (IX, X, XI, XII)', ids: [9, 10, 11, 12] }
];

export function CranialNerveAssessment({ 
  appointmentId, 
  priorityPattern, 
  updatePriorityPattern,
  showImages,
  compactMode,
  onShowInfo
}: { 
  appointmentId: string;
  priorityPattern?: string | null;
  updatePriorityPattern?: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
  showImages: boolean;
  compactMode?: boolean;
  onShowInfo?: (nerveId: number) => void;
}) {
  const { tests, loading, updateTest } = useCranialNerveTests(appointmentId, priorityPattern, updatePriorityPattern);
  const [showOnlyInhibited, setShowOnlyInhibited] = useState(false);
  const [showOnlyPriority, setShowOnlyPriority] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customImages, setCustomImages] = useState<Record<string, { primary: string | null, secondary: string | null }>>({});

  const pattern = useMemo(() => safeParse(priorityPattern, {} as any), [priorityPattern]);
  const nervePattern = pattern.cranialNerves || {};

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('brain_reflex_customizations').select('reflex_id, image_url, secondary_image_url').eq('user_id', user.id);
        const mapping: Record<string, { primary: string | null, secondary: string | null }> = {};
        data?.forEach(item => {
          mapping[item.reflex_id] = { primary: item.image_url, secondary: item.secondary_image_url };
        });
        setCustomImages(mapping);
      } catch (err) {
        console.error("Error fetching nerve images:", err);
      }
    };
    fetchImages();
  }, []);

  const filteredNerves = useMemo(() => {
    return CRANIAL_NERVES.filter(nerve => {
      const test = tests.find(t => t.nerve_id === nerve.id.toString()) || { is_inhibited: false };
      const nerveName = `${nerve.name}: ${nerve.latinName}`;
      
      const matchesSearch = nerveName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           nerve.nuclei.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isAnyInhib = nervePattern[`${nerveName} (L)`] === 'Inhibited' || 
                        nervePattern[`${nerveName} (R)`] === 'Inhibited' || 
                        nervePattern[nerveName] === 'Inhibited' || 
                        test.is_inhibited;

      const matchesInhibited = showOnlyInhibited ? isAnyInhib : true;
      
      const isPriority = test.is_primary_priority;
      const matchesPriority = showOnlyPriority ? isPriority : true;
      
      return matchesSearch && matchesInhibited && matchesPriority;
    });
  }, [tests, searchQuery, showOnlyInhibited, showOnlyPriority, nervePattern]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Loader2 className="animate-spin text-chart-primary" size={32} />
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Loading Assessment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-muted/50 p-2 rounded-xl border border-border shadow-inner print:hidden mb-2">
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search nerves..."
              className="pl-8 h-7 rounded-lg border-border bg-card text-[10px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 px-3 border-l border-border">
            <Switch
              id="inhibited-filter-nerve"
              checked={showOnlyInhibited}
              onCheckedChange={setShowOnlyInhibited}
              className="data-[state=checked]:bg-destructive scale-[0.6]"
            />
            <Label htmlFor="inhibited-filter-nerve" className="text-[10px] font-medium uppercase tracking-wider cursor-pointer text-muted-foreground">
              Only Inhibited
            </Label>
          </div>
          <div className="flex items-center space-x-2 px-3 border-l border-border">
            <Switch
              id="priority-filter-nerve"
              checked={showOnlyPriority}
              onCheckedChange={setShowOnlyPriority}
              className="data-[state=checked]:bg-chart-primary scale-[0.6]"
            />
            <Label htmlFor="priority-filter-nerve" className="text-[10px] font-medium uppercase tracking-wider cursor-pointer text-muted-foreground">
              Only Priority
            </Label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-card border-border font-medium text-[7px] uppercase tracking-wider px-2 py-0.5 rounded-full">
            {tests.filter(t => t.is_inhibited).length} Active
          </Badge>
        </div>
      </div>

      <div className="space-y-5">
        {NERVE_CLUSTERS.map(cluster => {
          const clusterNerves = filteredNerves.filter(n => cluster.ids.includes(n.id));
          if (clusterNerves.length === 0) return null;

          return (
            <div key={cluster.id} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-foreground text-primary-foreground flex items-center justify-center shadow-sm">
                  <Activity size={16} />
                </div>
                <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">{cluster.label}</h3>
                <div className="flex-1 h-px bg-muted" />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {clusterNerves.map((nerve) => {
                  const nerveName = `${nerve.name}: ${nerve.latinName}`;
                  return (
                    <NerveTestItem 
                      key={nerve.id}
                      nerve={nerve}
                      test={tests.find(t => t.nerve_id === nerve.id.toString()) || {}}
                      statusL={nervePattern[`${nerveName} (L)`]}
                      statusR={nervePattern[`${nerveName} (R)`]}
                      statusMidline={nervePattern[nerveName]}
                      isLateralized={nerve.isLateralized || false}
                      images={customImages[`cn${nerve.id}`]}
                      showImage={showImages}
                      compact={compactMode}
                      onUpdate={updateTest}
                      onShowInfo={onShowInfo}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}