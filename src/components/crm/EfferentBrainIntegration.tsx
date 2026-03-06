"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Brain, 
  Zap, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Layers, 
  RefreshCw, 
  Sparkles,
  Heart,
  X,
  Activity,
  Target,
  Loader2,
  Info,
  ShieldAlert,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAIN_REFLEX_POINTS, BrainReflexPoint } from '@/data/brain-reflex-data';
import { supabase } from "@/integrations/supabase/client";

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
  onCancel?: () => void;
  initialValue?: string;
  initialEntryPoint?: string;
}

const ZoneCard = ({ point, images, isSelected, onSelect, isLoading }: { 
  point: BrainReflexPoint;
  images?: ReflexImages;
  isSelected: boolean;
  onSelect: (side: 'Left' | 'Right' | 'Bilateral') => void;
  isLoading: boolean;
}) => {
    const imageUrl = images?.secondaryUrl || images?.primaryUrl;
    const isMidline = point.lateralization === 'Bilateral' || point.lateralization === 'Mixed';

    return (
        <div className={cn(
            "relative flex flex-col items-center p-2 rounded-xl border-2 transition-all duration-300 group",
            isSelected 
                ? "bg-indigo-600 border-indigo-600 shadow-lg z-10" 
                : "bg-white border-slate-100 hover:border-indigo-200"
        )}>
            <div className={cn(
                "w-full aspect-square rounded-lg overflow-hidden mb-1.5 flex items-center justify-center transition-colors",
                isSelected ? "bg-white/10" : "bg-slate-50"
            )}>
                {isLoading ? (
                  <Loader2 size={14} className="text-slate-300 animate-spin" />
                ) : imageUrl ? (
                    <img src={imageUrl} alt={point.name} className="w-full h-full object-cover" />
                ) : (
                    <Brain size={18} className={isSelected ? "text-white" : "text-slate-300"} />
                )}
            </div>
            <p className={cn(
                "font-black text-[8px] uppercase tracking-tight truncate w-full text-center",
                isSelected ? "text-white" : "text-slate-700"
            )}>
                {point.name}
            </p>

            {/* Side Selection Overlay */}
            <div className={cn(
                "absolute inset-0 bg-slate-900/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-2 gap-1.5 transition-all duration-300",
                isSelected 
                  ? "opacity-100 pointer-events-auto" 
                  : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
            )}>
                <p className="text-[7px] font-black text-indigo-300 uppercase tracking-widest mb-1">Select Side</p>
                <div className="flex flex-col w-full gap-1">
                    {!isMidline && (
                        <div className="flex gap-1 w-full">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onSelect('Left'); }}
                                className="flex-1 bg-white/10 hover:bg-indigo-500 text-white text-[8px] font-black py-1 rounded-md border border-white/10 transition-colors"
                            >
                                L
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onSelect('Right'); }}
                                className="flex-1 bg-white/10 hover:bg-indigo-500 text-white text-[8px] font-black py-1 rounded-md border border-white/10 transition-colors"
                            >
                                R
                            </button>
                        </div>
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onSelect('Bilateral'); }}
                        className="w-full bg-white/10 hover:bg-indigo-500 text-white text-[8px] font-black py-1 rounded-md border border-white/10 transition-colors"
                    >
                        {isMidline ? 'Select' : 'Bilateral'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const EfferentBrainIntegration = ({ onSave, onCancel, initialEntryPoint }: EfferentBrainIntegrationProps) => {
  const [step, setStep] = useState<Step>(initialEntryPoint ? 'COORD_1' : 'ENTRY');
  const [entryPoint, setEntryPoint] = useState(initialEntryPoint || "");
  const [coord1, setCoord1] = useState<Coordinate>({ point: null, side: null });
  const [coord2, setCoord2] = useState<Coordinate>({ point: null, side: null });
  const [method, setMethod] = useState<IntegrationMethod | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [customizations, setCustomizations] = useState<Record<string, ReflexImages>>({});
  const [loadingImages, setLoadingImages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleComplete = () => {
    const summary = `Efferent Integration: ${entryPoint} -> ${coord1.side} ${coord1.point?.name} + ${coord2.side} ${coord2.point?.name} via ${method}`;
    onSave(summary);
    setIsComplete(true);
  };

  const renderCoordinateSelection = (coord: Coordinate, setCoord: (c: Coordinate) => void, next: Step, prev: Step, title: string) => {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
        <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
                <h3 className="text-lg font-black text-slate-900">{title}</h3>
                <p className="text-[10px] text-slate-500 font-medium">Select a zone and side to continue.</p>
            </div>
            <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <Input 
                    placeholder="Search..." 
                    className="h-8 pl-8 rounded-lg border-slate-200 text-[10px] font-bold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={cn("p-3 rounded-xl border transition-all", coord.point?.category === 'Cortical' ? "bg-purple-50 border-purple-200" : "bg-slate-50 border-slate-100")}>
            <div className="flex items-center gap-2 mb-1">
                <ShieldAlert size={14} className="text-purple-600" />
                <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest">Cortical</p>
            </div>
            <p className="text-[9px] font-bold text-purple-900">Contralateral Logic</p>
          </div>
          <div className={cn("p-3 rounded-xl border transition-all", coord.point?.category === 'Subcortical' ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-100")}>
            <div className="flex items-center gap-2 mb-1">
                <ShieldAlert size={14} className="text-indigo-600" />
                <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Subcortical</p>
            </div>
            <p className="text-[9px] font-bold text-indigo-900">Ipsilateral Logic</p>
          </div>
        </div>

        <div className="space-y-6">
            <div className="space-y-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Cortical Zones</p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {corticalPoints.map(p => (
                        <ZoneCard 
                            key={p.id}
                            point={p}
                            isSelected={coord.point?.id === p.id}
                            images={customizations[p.id]}
                            onSelect={(side) => {
                                setCoord({ point: p, side });
                                nextStep(next);
                            }}
                            isLoading={loadingImages}
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Subcortical Zones</p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {subcorticalPoints.map(p => (
                        <ZoneCard 
                            key={p.id}
                            point={p}
                            isSelected={coord.point?.id === p.id}
                            images={customizations[p.id]}
                            onSelect={(side) => {
                                setCoord({ point: p, side });
                                nextStep(next);
                            }}
                            isLoading={loadingImages}
                        />
                    ))}
                </div>
            </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" onClick={() => prevStep(prev)} className="flex-1 h-10 rounded-xl font-bold text-xs">
            <ChevronLeft size={16} className="mr-1" /> Back
          </Button>
        </div>
      </div>
    );
  };

  const SelectionSummary = () => (
    <div className="grid grid-cols-2 gap-2 mb-4">
      <div className={cn("p-3 rounded-xl border transition-all", coord1.point ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-100")}>
        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Coordinate 1</p>
        <p className="text-[11px] font-black text-slate-900 truncate">
            {coord1.point ? `${coord1.side} ${coord1.point.name}` : 'Pending...'}
        </p>
      </div>
      <div className={cn("p-3 rounded-xl border transition-all", coord2.point ? "bg-purple-50 border-purple-200" : "bg-slate-50 border-slate-100")}>
        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Coordinate 2</p>
        <p className="text-[11px] font-black text-slate-900 truncate">
            {coord2.point ? `${coord2.side} ${coord2.point.name}` : 'Pending...'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <Brain size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-none">Efferent Integration</h2>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1.5">
              Step {['ENTRY', 'COORD_1', 'COORD_2', 'METHOD', 'CALIBRATE', 'REASSESS'].indexOf(step) + 1} of 6
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && <Badge className="bg-emerald-500 text-white border-none font-black text-[8px]">Cleared</Badge>}
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full h-8 w-8 hover:bg-slate-100">
              <X size={16} className="text-slate-400" />
            </Button>
          )}
        </div>
      </div>

      {step !== 'ENTRY' && <SelectionSummary />}

      <div className="flex flex-col justify-center">
        {step === 'ENTRY' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="space-y-0.5">
              <h3 className="text-lg font-black text-slate-900">Entry Pathway</h3>
              <p className="text-xs text-slate-500 font-medium">What stimulus brought you here?</p>
            </div>
            <div className="relative">
                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                <Input 
                    placeholder="e.g. Left Psoas..." 
                    className="h-11 rounded-xl border-slate-200 focus:border-indigo-500 transition-all text-base font-bold pl-10"
                    value={entryPoint}
                    onChange={(e) => setEntryPoint(e.target.value)}
                />
            </div>
            <div className="flex flex-wrap gap-1.5">
                {["Left Psoas", "Right SCM", "FPR", "Moro", "Gait"].map(tag => (
                    <button key={tag} onClick={() => setEntryPoint(tag)} className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-100 text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-all">+ {tag}</button>
                ))}
            </div>
            <Button disabled={!entryPoint} onClick={() => nextStep('COORD_1')} className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-black shadow-lg">
              Find Priority Zone <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        )}

        {step === 'COORD_1' && renderCoordinateSelection(coord1, setCoord1, 'COORD_2', initialEntryPoint ? 'COORD_1' : 'ENTRY', 'Coordinate 1')}
        {step === 'COORD_2' && renderCoordinateSelection(coord2, setCoord2, 'METHOD', 'COORD_1', 'Coordinate 2')}

        {step === 'METHOD' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="space-y-0.5">
              <h3 className="text-lg font-black text-slate-900">Calibration Method</h3>
              <p className="text-xs text-slate-500 font-medium">Challenge the system for the preferred method.</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'Tapping', icon: Zap, color: 'text-amber-500', best: 'Fast resets' },
                { id: 'Holding + Intention', icon: Heart, color: 'text-rose-500', best: 'Deep trauma' },
                { id: 'Tuning Fork', icon: Activity, color: 'text-blue-500', best: 'Vibrational' }
              ].map((m) => (
                <Button
                  key={m.id}
                  variant="outline"
                  className={cn(
                    "h-16 justify-start gap-4 px-6 rounded-2xl border-2 transition-all group",
                    method === m.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200"
                  )}
                  onClick={() => {
                    setMethod(m.id as IntegrationMethod);
                    nextStep('CALIBRATE');
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <m.icon size={20} className={m.color} />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-sm">{m.id}</div>
                    <div className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Best for: {m.best}</div>
                  </div>
                </Button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => prevStep('COORD_2')} className="w-full h-10 rounded-xl font-bold text-xs">
              <ChevronLeft size={16} className="mr-1" /> Back
            </Button>
          </div>
        )}

        {step === 'CALIBRATE' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="bg-slate-950 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><Sparkles size={120} /></div>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <Zap size={20} className="text-amber-400 fill-amber-400" /> 
                    </div>
                    <div>
                        <h3 className="text-xl font-black tracking-tight">Calibration</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">Integrating Pathways</p>
                    </div>
                </div>
                <Badge className="bg-indigo-600 text-white border-none font-black text-[8px] uppercase tracking-widest px-3 py-1">
                    {method}
                </Badge>
              </div>

              <div className="relative z-10 mb-6 p-5 bg-white rounded-2xl text-slate-900 shadow-xl border-t-4 border-indigo-600">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={14} className="text-indigo-600" />
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Instructions</p>
                </div>
                <div className="space-y-4">
                  {method === 'Tapping' && (
                    <p className="text-base font-black leading-tight text-slate-900">
                      Simultaneously <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">TAP</span> both reflex points for 3-5 seconds.
                    </p>
                  )}
                  {method === 'Holding + Intention' && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold leading-tight text-slate-700">
                        Hold both points lightly and mentally repeat:
                      </p>
                      <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-center italic font-black text-indigo-600 text-sm">
                        "{entryPoint} — {coord1.side} {coord1.point?.name} — {coord2.side} {coord2.point?.name}"
                      </div>
                    </div>
                  )}
                  {method === 'Tuning Fork' && (
                    <p className="text-base font-black leading-tight text-slate-900">
                      TL both points and strike tuning fork on the <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">Cranium</span>.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="space-y-2">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Coord 1</p>
                    <p className="text-[10px] font-black truncate">{coord1.side} {coord1.point?.name}</p>
                  </div>
                  {coord1.point && (customizations[coord1.point.id]?.secondaryUrl || customizations[coord1.point.id]?.primaryUrl) && (
                    <div className="aspect-square rounded-xl overflow-hidden border-2 border-white/5 bg-white/5">
                      <img src={customizations[coord1.point.id].secondaryUrl || customizations[coord1.point.id].primaryUrl || ""} alt="Reflex 1" className="w-full h-full object-cover opacity-80" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                    <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-0.5">Coord 2</p>
                    <p className="text-[10px] font-black truncate">{coord2.side} {coord2.point?.name}</p>
                  </div>
                  {coord2.point && (customizations[coord2.point.id]?.secondaryUrl || customizations[coord2.point.id]?.primaryUrl) && (
                    <div className="aspect-square rounded-xl overflow-hidden border-2 border-white/5 bg-white/5">
                      <img src={customizations[coord2.point.id].secondaryUrl || customizations[coord2.point.id].primaryUrl || ""} alt="Reflex 2" className="w-full h-full object-cover opacity-80" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => prevStep('METHOD')} className="flex-1 h-11 rounded-xl font-bold text-xs">
                <ChevronLeft size={16} className="mr-1" /> Back
              </Button>
              <Button onClick={() => nextStep('REASSESS')} className="flex-[2] h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-xs uppercase tracking-widest shadow-lg">
                Complete <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 'REASSESS' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="bg-emerald-50 p-8 rounded-[2rem] border-2 border-emerald-100 text-center">
              <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mx-auto mb-4">
                <RefreshCw size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-emerald-900 mb-1">Final Re-assessment</h3>
              <p className="text-emerald-700 font-bold text-sm">
                Re-stimulate <span className="font-black underline decoration-emerald-300 underline-offset-4">"{entryPoint}"</span> and test the IM.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Button className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-lg font-black shadow-lg" onClick={handleComplete}>
                Pathway is Clear <CheckCircle2 size={20} className="ml-2" />
              </Button>
              <Button variant="outline" className="h-12 rounded-xl border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-black text-[10px] uppercase tracking-widest" onClick={() => nextStep('COORD_1')}>
                Still Inhibited - Find New Zones
              </Button>
            </div>
            
            <Button variant="ghost" onClick={() => prevStep('CALIBRATE')} className="w-full h-10 rounded-xl font-bold text-xs">
              <ChevronLeft size={16} className="mr-1" /> Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EfferentBrainIntegration;