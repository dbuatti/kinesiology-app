
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Brain,
  Zap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  RefreshCw,
  Heart,
  X,
  Activity,
  Loader2,
  Info,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAIN_REFLEX_POINTS, BrainReflexPoint } from '@/data/brain-reflex-data';
import { CRANIAL_NERVES } from '@/data/cranial-nerve-data';
import { supabase } from "@/integrations/supabase/client";
import BrainReflexModal from './BrainReflexModal';

type Step = 'ENTRY' | 'COORD_1' | 'COORD_2' | 'METHOD' | 'CALIBRATE' | 'REASSESS';
type IntegrationMethod = 'Tapping' | 'Holding + Intention' | 'Tuning Fork';

interface Coordinate {
  point: BrainReflexPoint | null;
  side: 'Left' | 'Right' | 'Bilateral' | null;
}

interface ReflexImages {
  primaryUrl: string | null;
  secondaryUrl: string | null;
}

interface EfferentBrainIntegrationProps {
  onSave: (summary: string) => void;
  onInhibited?: (summary: string) => void;
  onCancel?: () => void;
  initialEntryPoint: string;
}

const ZoneCard = ({ point, images, isSelected, onSelect, onShowInfo, isLoading }: { 
  point: BrainReflexPoint;
  images?: ReflexImages;
  isSelected: boolean;
  onSelect: (side: 'Left' | 'Right' | 'Bilateral') => void;
  onShowInfo: (point: BrainReflexPoint) => void;
  isLoading: boolean;
}) => {
    const imageUrl = images?.secondaryUrl || images?.primaryUrl;
    const isMidline = point.lateralization === 'Bilateral' || point.lateralization === 'Mixed';

    return (
        <div className={cn(
            "relative flex flex-col items-center p-2 rounded-xl border transition-all duration-300 group",
            isSelected 
                ? "bg-primary border-primary z-10" 
                : "bg-card border-border hover:border-primary/30"
        )}>
            <div className={cn(
                "w-full aspect-square rounded-lg overflow-hidden mb-2 flex items-center justify-center transition-colors relative",
                isSelected ? "bg-primary-foreground/10" : "bg-muted/50"
            )}>
                {isLoading ? (
                  <Loader2 size={14} className="text-muted-foreground animate-spin" />
                ) : imageUrl ? (
                    <img loading="lazy" decoding="async" src={imageUrl} alt={point.name} className="w-full h-full object-cover" />
                ) : (
                    <Brain size={18} className={isSelected ? "text-primary-foreground" : "text-muted-foreground"} />
                )}

                {/* Info Trigger */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onShowInfo(point); }}
                    className="w-6 h-6 rounded-full bg-primary-foreground/90 backdrop-blur-sm flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <Info size={14} />
                  </button>
                </div>
            </div>
            <p className={cn(
                "font-semibold text-[10px] uppercase tracking-tight truncate w-full text-center",
                isSelected ? "text-primary-foreground" : "text-foreground"
            )}>
                {point.name}
            </p>

            <div className={cn(
                "absolute inset-0 bg-foreground/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-2 gap-2 transition-all duration-300",
                isSelected 
                  ? "opacity-100 pointer-events-auto" 
                  : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
            )}>
                <p className="text-[7px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Select Side</p>
                <div className="flex flex-col w-full gap-1">
                    {!isMidline && (
                        <div className="flex gap-1 w-full">
                            <button onClick={(e) => { e.stopPropagation(); onSelect('Left'); }} className="flex-1 bg-primary-foreground/10 hover:bg-primary text-primary-foreground text-[10px] font-semibold py-1 rounded-md border border-primary-foreground/10 transition-colors">L</button>
                            <button onClick={(e) => { e.stopPropagation(); onSelect('Right'); }} className="flex-1 bg-primary-foreground/10 hover:bg-primary text-primary-foreground text-[10px] font-semibold py-1 rounded-md border border-primary-foreground/10 transition-colors">R</button>
                        </div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onSelect('Bilateral'); }} className="w-full bg-primary-foreground/10 hover:bg-primary text-primary-foreground text-[10px] font-semibold py-1 rounded-md border border-primary-foreground/10 transition-colors">{isMidline ? 'Select' : 'Bilateral'}</button>
                </div>
            </div>
        </div>
    );
};

const EfferentBrainIntegration = ({ onSave, onInhibited, onCancel, initialEntryPoint }: EfferentBrainIntegrationProps) => {
  const [step, setStep] = useState<Step>(initialEntryPoint ? 'COORD_1' : 'ENTRY');
  const [entryPoint, setEntryPoint] = useState(initialEntryPoint || "");
  const [coord1, setCoord1] = useState<Coordinate>({ point: null, side: null });
  const [coord2, setCoord2] = useState<Coordinate>({ point: null, side: null });
  const [method, setMethod] = useState<IntegrationMethod | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [customizations, setCustomizations] = useState<Record<string, ReflexImages>>({});
  const [loadingImages, setLoadingImages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Info Modal State
  const [infoPoint, setInfoPoint] = useState<BrainReflexPoint | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  // When an entry point is already established (passed from the pathway wizard),
  // skip the ENTRY step entirely and go straight to coordinate selection.
  const skipEntry = Boolean(initialEntryPoint);

  useEffect(() => {
    const fetchCustomizations = async () => {
      setLoadingImages(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('brain_reflex_customizations').select('reflex_id, image_url, secondary_image_url').eq('user_id', user.id);
        const mapping: Record<string, ReflexImages> = {};
        data?.forEach(item => { mapping[item.reflex_id] = { primaryUrl: item.image_url, secondaryUrl: item.secondary_image_url }; });
        setCustomizations(mapping);
      } catch (err) {
        console.error("Failed to fetch reflex images:", err);
      } finally {
        setLoadingImages(false);
      }
    };
    fetchCustomizations();
  }, []);

  const nerveInfo = useMemo(() => {
    if (!entryPoint) return null;
    return CRANIAL_NERVES.find(n => entryPoint.includes(n.name) || entryPoint.includes(n.latinName));
  }, [entryPoint]);

  const nextStep = (next: Step) => setStep(next);
  const prevStep = (prev: Step) => setStep(prev);

  const filteredPoints = useMemo(() => {
    return BRAIN_REFLEX_POINTS.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const corticalPoints = filteredPoints.filter(p => p.category === 'Cortical');
  const subcorticalPoints = filteredPoints.filter(p => p.category === 'Subcortical');

  const handleShowInfo = (point: BrainReflexPoint) => {
    setInfoPoint(point);
    setInfoOpen(true);
  };

  const formatCoordLabel = (coord: Coordinate) => {
    if (!coord.point) return 'Pending...';
    if (coord.side === 'Bilateral') return coord.point.name;
    return `${coord.side} ${coord.point.name}`;
  };

  const handleComplete = () => {
    const label1 = formatCoordLabel(coord1);
    const label2 = formatCoordLabel(coord2);
    const summary = `Efferent Integration: ${entryPoint} -> ${label1} + ${label2} via ${method}`;
    onSave(summary);
    setIsComplete(true);
  };

  const handleInhibited = () => {
    const label1 = formatCoordLabel(coord1);
    const label2 = formatCoordLabel(coord2);
    const summary = `Efferent Integration (STILL INHIBITED): ${entryPoint} -> ${label1} + ${label2} via ${method}`;
    onInhibited?.(summary);
  };

  const renderCoordinateSelection = (coord: Coordinate, setCoord: (c: Coordinate) => void, next: Step, prev: Step, title: string) => {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
        <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground font-medium">Select a zone and side to continue.</p>
            </div>
            <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                <Input placeholder="Search..." className="h-8 pl-8 rounded-md border-border text-[10px] font-semibold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
        </div>

        {nerveInfo && (
          <div className="p-4 bg-muted/50 rounded-xl border border-border flex items-start gap-3">
            <Info size={16} className="text-muted-foreground shrink-0 mt-1" />
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Tip: For {nerveInfo.name}, prioritize the <span className="underline">{nerveInfo.nuclei}</span> nuclei reflex point as one of your coordinates.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className={cn("p-3 rounded-xl border transition-all", coord.point?.category === 'Cortical' ? "bg-success/10 text-success-strong border-success/30" : "bg-muted/50 border-border")}>
            <div className="flex items-center gap-2 mb-1"><ShieldAlert size={14} className="text-success" /><p className="text-[10px] font-semibold text-success uppercase tracking-wider">Cortical</p></div>
            <p className="text-[10px] font-semibold text-foreground">Contralateral Logic</p>
          </div>
          <div className={cn("p-3 rounded-xl border transition-all", coord.point?.category === 'Subcortical' ? "bg-primary/10 text-primary-strong border-primary/30" : "bg-muted/50 border-border")}>
            <div className="flex items-center gap-2 mb-1"><ShieldAlert size={14} className="text-primary" /><p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Subcortical</p></div>
            <p className="text-[10px] font-semibold text-foreground">Ipsilateral Logic</p>
          </div>
        </div>

        <div className="space-y-6">
            <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground px-1">Cortical Zones</p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {corticalPoints.map(p => (
                        <ZoneCard 
                          key={p.id} 
                          point={p} 
                          isSelected={coord.point?.id === p.id} 
                          images={customizations[p.id]} 
                          onSelect={(side) => { setCoord({ point: p, side }); nextStep(next); }} 
                          onShowInfo={handleShowInfo}
                          isLoading={loadingImages} 
                        />
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground px-1">Subcortical Zones</p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {subcorticalPoints.map(p => (
                        <ZoneCard 
                          key={p.id} 
                          point={p} 
                          isSelected={coord.point?.id === p.id} 
                          images={customizations[p.id]} 
                          onSelect={(side) => { setCoord({ point: p, side }); nextStep(next); }} 
                          onShowInfo={handleShowInfo}
                          isLoading={loadingImages} 
                        />
                    ))}
                </div>
            </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={() => prevStep(prev)} className="flex-1"><ChevronLeft size={14} /> Back</Button>
        </div>
      </div>
    );
  };

  const SelectionSummary = () => (
    <div className="grid grid-cols-2 gap-2 mb-4">
      <div className={cn("p-3 rounded-xl border transition-all", coord1.point ? "bg-primary/10 border-primary/30" : "bg-muted/50 border-border")}>
        <p className="text-[7px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Coordinate 1</p>
        <p className="text-[11px] font-semibold text-foreground truncate">{formatCoordLabel(coord1)}</p>
      </div>
      <div className={cn("p-3 rounded-xl border transition-all", coord2.point ? "bg-success/10 border-success/30" : "bg-muted/50 border-border")}>
        <p className="text-[7px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Coordinate 2</p>
        <p className="text-[11px] font-semibold text-foreground truncate">{formatCoordLabel(coord2)}</p>
      </div>
    </div>
  );

  return (
    <div className="py-4 max-w-[600px] mx-auto relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 mt-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-foreground">Efferent Integration</h2>
          <div className="flex items-center gap-2">
            {['ENTRY', 'COORD_1', 'COORD_2', 'METHOD', 'CALIBRATE', 'REASSESS'].map((s, i) => (
              <div key={s} className={cn("w-2 h-2 rounded-full transition-colors", ['ENTRY', 'COORD_1', 'COORD_2', 'METHOD', 'CALIBRATE', 'REASSESS'].indexOf(step) >= i ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && <Badge className="bg-success/10 text-success-strong border-success/30 font-semibold text-[10px]">Cleared</Badge>}
          {onCancel && <Button variant="ghost" size="sm" onClick={onCancel}><X size={14} className="text-muted-foreground" /></Button>}
        </div>
      </div>

      {step !== 'ENTRY' && <SelectionSummary />}

      {/* Entry pathway — shown as read-only when already established from the wizard */}
      {!skipEntry && step === 'ENTRY' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="space-y-1"><h3 className="text-sm font-medium text-foreground">Entry Pathway</h3><p className="text-xs text-muted-foreground font-medium">What stimulus brought you here?</p></div>
          <div className="relative"><Zap className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={16} /><Input placeholder="e.g. Left Psoas..." className="h-10 rounded-lg border-border text-sm font-medium pl-10" value={entryPoint} onChange={(e) => setEntryPoint(e.target.value)} /></div>
          <Button disabled={!entryPoint} onClick={() => nextStep('COORD_1')} className="w-full h-10 rounded-lg bg-primary hover:bg-primary/90 text-xs font-medium">Find Priority Zone <ChevronRight size={14} className="ml-1" /></Button>
        </div>
      )}

      {skipEntry && step === 'COORD_1' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg border border-border mb-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground">Entry pathway</p>
              <p className="text-xs font-semibold truncate text-foreground max-w-[200px]">{entryPoint}</p>
            </div>
            <Badge className="bg-primary/10 text-primary-strong border-none font-medium text-[10px] uppercase tracking-wider px-2 py-0 rounded-full">Set</Badge>
          </div>
          {renderCoordinateSelection(coord1, setCoord1, 'COORD_2', 'COORD_1', 'Coordinate 1')}
        </div>
      )}

      {!skipEntry && step === 'COORD_1' && renderCoordinateSelection(coord1, setCoord1, 'COORD_2', 'ENTRY', 'Coordinate 1')}
      {step === 'COORD_2' && renderCoordinateSelection(coord2, setCoord2, 'METHOD', 'COORD_1', 'Coordinate 2')}

        {step === 'METHOD' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="space-y-1"><h3 className="text-sm font-medium text-foreground">Calibration Method</h3><p className="text-xs text-muted-foreground font-medium">Challenge the system for the preferred method.</p></div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'Tapping', icon: Zap, color: 'text-primary', best: 'Fast resets' },
                { id: 'Holding + Intention', icon: Heart, color: 'text-destructive', best: 'Deep trauma' },
                { id: 'Tuning Fork', icon: Activity, color: 'text-primary', best: 'Vibrational' }
              ].map((m) => (
                <Button key={m.id} variant="outline" className={cn("h-12 justify-start gap-4 px-6 rounded-xl border transition-all group", method === m.id ? "border-primary bg-primary/5 text-primary-strong" : "border-border hover:border-primary/30")} onClick={() => { setMethod(m.id as IntegrationMethod); nextStep('CALIBRATE'); }}>
                  <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><m.icon size={20} className={m.color} /></div>
                  <div className="text-left"><div className="font-semibold text-sm">{m.id}</div><div className="text-[11px] font-semibold text-muted-foreground">Best for: {m.best}</div></div>
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => prevStep('COORD_2')} className="w-full"><ChevronLeft size={14} /> Back</Button>
          </div>
        )}

        {step === 'CALIBRATE' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="bg-muted/50 p-4 rounded-xl border border-border relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20"><Zap size={20} className="text-primary" /></div><div><h3 className="text-[15px] font-semibold text-foreground tracking-tight">Calibration</h3><p className="text-muted-foreground font-medium text-xs">Integrating Pathways</p></div></div>
                <Badge className="bg-primary/10 text-primary-strong border-primary/20 font-semibold text-[10px] uppercase tracking-wider px-3 py-1">{method}</Badge>
              </div>
              <div className="relative z-10 mb-4 p-4 bg-card rounded-xl text-foreground border border-border">
                <div className="flex items-center gap-2 mb-2"><Info size={14} className="text-primary" /><p className="text-xs font-medium text-muted-foreground">Instructions</p></div>
                <div className="space-y-3">
                  {method === 'Tapping' && <p className="text-sm font-semibold leading-tight text-foreground">Simultaneously <span className="text-primary underline decoration-primary/30 underline-offset-4">TAP</span> both reflex points for 3-5 seconds.</p>}
                  {method === 'Holding + Intention' && <div className="space-y-2"><p className="text-[13px] font-semibold leading-snug text-foreground">Hold both points lightly and mentally repeat:</p><div className="p-2 bg-primary/5 rounded-xl border border-primary/10 text-center italic font-semibold text-primary-strong text-xs">"{entryPoint} — {formatCoordLabel(coord1)} — {formatCoordLabel(coord2)}"</div></div>}
                  {method === 'Tuning Fork' && <p className="text-sm font-semibold leading-tight text-foreground">TL both points and strike tuning fork on the <span className="text-primary underline decoration-primary/30 underline-offset-4">Cranium</span>.</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 relative z-10">
                <div className="space-y-2">
                  <div className="p-2 bg-card rounded-xl border border-border text-center">
                    <p className="text-[7px] font-semibold text-primary uppercase tracking-wider mb-1">Coord 1</p>
                    <p className="text-[10px] font-semibold truncate text-foreground">{formatCoordLabel(coord1)}</p>
                  </div>
                  {coord1.point && (customizations[coord1.point.id]?.secondaryUrl || customizations[coord1.point.id]?.primaryUrl) && (
                    <div className="aspect-[16/10] rounded-xl overflow-hidden border border-border bg-muted/50">
                      <img loading="lazy" decoding="async" src={customizations[coord1.point.id].secondaryUrl || customizations[coord1.point.id].primaryUrl || ""} alt="Reflex 1" className="w-full h-full object-cover opacity-80" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="p-2 bg-card rounded-xl border border-border text-center">
                    <p className="text-[7px] font-semibold text-primary uppercase tracking-wider mb-1">Coord 2</p>
                    <p className="text-[10px] font-semibold truncate text-foreground">{formatCoordLabel(coord2)}</p>
                  </div>
                  {coord2.point && (customizations[coord2.point.id]?.secondaryUrl || customizations[coord2.point.id]?.primaryUrl) && (
                    <div className="aspect-[16/10] rounded-xl overflow-hidden border border-border bg-muted/50">
                      <img loading="lazy" decoding="async" src={customizations[coord2.point.id].secondaryUrl || customizations[coord2.point.id].primaryUrl || ""} alt="Reflex 2" className="w-full h-full object-cover opacity-80" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => prevStep('METHOD')} className="flex-1"><ChevronLeft size={14} /> Back</Button>
              <Button onClick={() => nextStep('REASSESS')} className="flex-[2] h-10 rounded-lg bg-primary hover:bg-primary/90 text-xs font-medium">Complete <ChevronRight size={14} className="ml-1" /></Button>
            </div>
          </div>
        )}

        {step === 'REASSESS' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="bg-success/5 p-6 rounded-xl border border-success/20 text-center">
              <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center mx-auto mb-3"><RefreshCw size={24} className="text-success" /></div>
              <h3 className="text-[15px] font-semibold text-foreground mb-1">Final Re-assessment</h3>
              <p className="text-muted-foreground font-semibold text-sm">Re-stimulate <span className="font-semibold underline decoration-primary/30 underline-offset-4">"{entryPoint}"</span> and test the IM.</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button className="h-10 rounded-lg bg-success/10 hover:bg-success/20 text-success-strong text-xs font-medium" onClick={handleComplete}>Pathway is Clear <CheckCircle2 size={16} className="ml-2" /></Button>
              <Button variant="outline" className="h-10 rounded-md border-border text-muted-foreground hover:bg-muted/50 font-medium text-[13px]" onClick={handleInhibited}>Still Inhibited - Add Layer</Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => prevStep('CALIBRATE')} className="w-full"><ChevronLeft size={14} /> Back</Button>
          </div>
        )}
      <BrainReflexModal 
        point={infoPoint}
        primaryUrl={infoPoint ? customizations[infoPoint.id]?.primaryUrl : null}
        secondaryUrl={infoPoint ? customizations[infoPoint.id]?.secondaryUrl : null}
        open={infoOpen}
        onOpenChange={setInfoOpen}
      />
    </div>
  );
};

export default EfferentBrainIntegration;
