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
  ImageIcon,
  Loader2,
  Info,
  ShieldAlert,
  MousePointer2,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAIN_REFLEX_POINTS, BrainReflexPoint } from '@/data/brain-reflex-data';
import { supabase } from "@/integrations/supabase/client";
import { showError } from '@/utils/toast';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  point: BrainReflexPoint, 
  images?: ReflexImages, 
  isSelected: boolean,
  onSelect: () => void,
  isLoading: boolean
}) => {
    const imageUrl = images?.secondaryUrl || images?.primaryUrl;

    return (
        <button 
            onClick={onSelect}
            className={cn(
                "relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-300 group",
                isSelected 
                    ? "bg-indigo-600 border-indigo-600 shadow-lg scale-105 z-10" 
                    : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md"
            )}
        >
            <div className={cn(
                "w-full aspect-square rounded-xl overflow-hidden mb-2 flex items-center justify-center transition-colors",
                isSelected ? "bg-white/10" : "bg-slate-50"
            )}>
                {isLoading ? (
                  <Loader2 size={16} className="text-slate-300 animate-spin" />
                ) : imageUrl ? (
                    <img src={imageUrl} alt={point.name} className="w-full h-full object-cover" />
                ) : (
                    <Brain size={20} className={isSelected ? "text-white" : "text-slate-300"} />
                )}
            </div>
            <p className={cn(
                "font-black text-[9px] uppercase tracking-tight truncate w-full text-center",
                isSelected ? "text-white" : "text-slate-700"
            )}>
                {point.name}
            </p>
            {isSelected && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                    <CheckCircle2 size={14} className="text-indigo-600" />
                </div>
            )}
        </button>
    );
};

const EfferentBrainIntegration = ({ onSave, onCancel, initialValue, initialEntryPoint }: EfferentBrainIntegrationProps) => {
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
        
        const { data } = await supabase
          .from('brain_reflex_customizations')
          .select('reflex_id, image_url, secondary_image_url')
          .eq('user_id', user.id);
        
        const mapping: Record<string, ReflexImages> = {};
        data?.forEach(item => { 
          mapping[item.reflex_id] = {
            primaryUrl: item.image_url,
            secondaryUrl: item.secondary_image_url
          };
        });
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
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 font-medium">Select a brain zone and its lateralization.</p>
            </div>
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input 
                    placeholder="Search zones..." 
                    className="h-9 pl-9 rounded-xl border-slate-200 text-xs font-bold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={cn(
            "p-4 rounded-2xl border-2 transition-all",
            coord.point?.category === 'Cortical' ? "bg-purple-50 border-purple-200" : "bg-slate-50 border-slate-100"
          )}>
            <div className="flex items-center gap-3 mb-2">
                <ShieldAlert size={18} className="text-purple-600" />
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Cortical Logic</p>
            </div>
            <p className="text-xs font-bold text-purple-900">Contralateral: Right cortex controls Left body.</p>
          </div>
          <div className={cn(
            "p-4 rounded-2xl border-2 transition-all",
            coord.point?.category === 'Subcortical' ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-100"
          )}>
            <div className="flex items-center gap-3 mb-2">
                <ShieldAlert size={18} className="text-indigo-600" />
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Subcortical Logic</p>
            </div>
            <p className="text-xs font-bold text-indigo-900">Ipsilateral: Left cerebellum controls Left body.</p>
          </div>
        </div>

        <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-8">
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cortical Zones</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {corticalPoints.map(p => (
                            <ZoneCard 
                                key={p.id}
                                point={p}
                                isSelected={coord.point?.id === p.id}
                                images={customizations[p.id]}
                                onSelect={() => setCoord({ ...coord, point: p })}
                                isLoading={loadingImages}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subcortical Zones</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {subcorticalPoints.map(p => (
                            <ZoneCard 
                                key={p.id}
                                point={p}
                                isSelected={coord.point?.id === p.id}
                                images={customizations[p.id]}
                                onSelect={() => setCoord({ ...coord, point: p })}
                                isLoading={loadingImages}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </ScrollArea>

        {coord.point && (
            <div className="p-6 bg-slate-900 rounded-[2rem] text-white animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                            <Target size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Zone</p>
                            <p className="text-xl font-black">{coord.point.name}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['Left', 'Right', 'Bilateral'].map(side => (
                            <Button 
                                key={side}
                                onClick={() => {
                                    setCoord({ ...coord, side: side as any });
                                    nextStep(next);
                                }}
                                className={cn(
                                    "h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                                    coord.side === side ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {side}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="ghost" onClick={() => prevStep(prev)} className="flex-1 h-12 rounded-xl font-bold">
            <ChevronLeft size={18} className="mr-2" /> Back
          </Button>
        </div>
      </div>
    );
  };

  const SelectionSummary = () => (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className={cn(
        "p-4 rounded-2xl border-2 transition-all", 
        coord1.point ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-100"
      )}>
        <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coordinate 1</p>
            {coord1.point && <Badge className="bg-indigo-600 text-white border-none text-[8px] font-black uppercase">{coord1.point.category}</Badge>}
        </div>
        <p className="text-sm font-black text-slate-900 truncate">
            {coord1.point ? `${coord1.side} ${coord1.point.name}` : 'Pending Selection...'}
        </p>
      </div>
      <div className={cn(
        "p-4 rounded-2xl border-2 transition-all", 
        coord2.point ? "bg-purple-50 border-purple-200" : "bg-slate-50 border-slate-100"
      )}>
        <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coordinate 2</p>
            {coord2.point && <Badge className="bg-purple-600 text-white border-none text-[8px] font-black uppercase">{coord2.point.category}</Badge>}
        </div>
        <p className="text-sm font-black text-slate-900 truncate">
            {coord2.point ? `${coord2.side} ${coord2.point.name}` : 'Pending Selection...'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 mt-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
            <Brain size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-none">Efferent Integration</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">
              Step {['ENTRY', 'COORD_1', 'COORD_2', 'METHOD', 'CALIBRATE', 'REASSESS'].indexOf(step) + 1} of 6
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && <Badge className="bg-emerald-500 text-white border-none font-black">Cleared</Badge>}
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-slate-100">
              <X size={20} className="text-slate-400" />
            </Button>
          )}
        </div>
      </div>

      {step !== 'ENTRY' && <SelectionSummary />}

      <div className="flex flex-col justify-center">
        {step === 'ENTRY' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Entry Pathway</h3>
              <p className="text-sm text-slate-500 font-medium">What stimulus brought you into this efferent correction?</p>
            </div>
            <div className="relative">
                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={20} />
                <Input 
                    placeholder="e.g. Left Psoas, Fear Paralysis Reflex..." 
                    className="h-14 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 transition-all text-lg font-bold pl-12"
                    value={entryPoint}
                    onChange={(e) => setEntryPoint(e.target.value)}
                />
            </div>
            <div className="flex flex-wrap gap-2">
                {["Left Psoas", "Right SCM", "FPR", "Moro Reflex", "Gait Pattern"].map(tag => (
                    <button 
                        key={tag}
                        onClick={() => setEntryPoint(tag)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-all"
                    >
                        + {tag}
                    </button>
                ))}
            </div>
            <Button 
              disabled={!entryPoint}
              onClick={() => nextStep('COORD_1')}
              className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-black shadow-xl shadow-indigo-200"
            >
              Find Priority Zone <ChevronRight size={20} className="ml-2" />
            </Button>
          </div>
        )}

        {step === 'COORD_1' && renderCoordinateSelection(coord1, setCoord1, 'COORD_2', initialEntryPoint ? 'COORD_1' : 'ENTRY', 'Coordinate 1 (Primary)')}
        {step === 'COORD_2' && renderCoordinateSelection(coord2, setCoord2, 'METHOD', 'COORD_1', 'Coordinate 2 (Secondary)')}

        {step === 'METHOD' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Calibration Method</h3>
              <p className="text-sm text-slate-500 font-medium">Challenge the system to find the preferred integration method.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'Tapping', icon: Zap, color: 'text-amber-500', desc: 'Simultaneous tapping for 3-5 seconds.', best: 'Fast resets, postural fixes' },
                { id: 'Holding + Intention', icon: Heart, color: 'text-rose-500', desc: 'Light hold + mental repetition of zones.', best: 'Deep trauma, complex patterns' },
                { id: 'Tuning Fork', icon: Activity, color: 'text-blue-500', desc: 'Vibrational reset on the cranium.', best: 'Multiple layers, vibrational priority' }
              ].map((m) => (
                <Button
                  key={m.id}
                  variant="outline"
                  className={cn(
                    "h-28 justify-start gap-5 px-8 rounded-[2rem] border-2 transition-all group",
                    method === m.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200"
                  )}
                  onClick={() => {
                    setMethod(m.id as IntegrationMethod);
                    nextStep('CALIBRATE');
                  }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <m.icon size={28} className={m.color} />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-xl">{m.id}</div>
                    <div className="text-xs font-medium text-slate-500 mt-1">{m.desc}</div>
                    <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-2">Best for: {m.best}</div>
                  </div>
                </Button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => prevStep('COORD_2')} className="w-full h-12 rounded-xl font-bold">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        )}

        {step === 'CALIBRATE' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-slate-950 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Sparkles size={200} /></div>
              <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <Zap size={32} className="text-amber-400 fill-amber-400" /> 
                    </div>
                    <div>
                        <h3 className="text-3xl font-black tracking-tight">Calibration Phase</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Integrating Neural Pathways</p>
                    </div>
                </div>
                <Badge className="bg-indigo-600 text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5">
                    {method}
                </Badge>
              </div>
              
              <div className="space-y-10 relative z-10">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10 text-center shadow-inner">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Coordinate 1</p>
                      <p className="text-xl font-black">{coord1.side} {coord1.point?.name}</p>
                    </div>
                    {coord1.point && (customizations[coord1.point.id]?.secondaryUrl || customizations[coord1.point.id]?.primaryUrl) && (
                      <div className="aspect-square rounded-[2rem] overflow-hidden border-4 border-white/5 bg-white/5 shadow-2xl">
                        <img 
                          src={customizations[coord1.point.id].secondaryUrl || customizations[coord1.point.id].primaryUrl || ""} 
                          alt="Reflex 1" 
                          className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" 
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10 text-center shadow-inner">
                      <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Coordinate 2</p>
                      <p className="text-xl font-black">{coord2.side} {coord2.point?.name}</p>
                    </div>
                    {coord2.point && (customizations[coord2.point.id]?.secondaryUrl || customizations[coord2.point.id]?.primaryUrl) && (
                      <div className="aspect-square rounded-[2rem] overflow-hidden border-4 border-white/5 bg-white/5 shadow-2xl">
                        <img 
                          src={customizations[coord2.point.id].secondaryUrl || customizations[coord2.point.id].primaryUrl || ""} 
                          alt="Reflex 2" 
                          className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" 
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-8 bg-white rounded-[2.5rem] text-slate-900 shadow-2xl border-t-8 border-indigo-600">
                  <div className="flex items-center gap-3 mb-4">
                    <Info size={20} className="text-indigo-600" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Clinical Instructions</p>
                  </div>
                  <div className="space-y-6">
                    {method === 'Tapping' && (
                      <p className="text-2xl font-black leading-tight text-slate-900">
                        Simultaneously <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">TAP</span> both reflex points for 3-5 seconds.
                      </p>
                    )}
                    {method === 'Holding + Intention' && (
                      <div className="space-y-6">
                        <p className="text-xl font-bold leading-tight text-slate-700">
                          Hold both points lightly and mentally repeat the integration sequence:
                        </p>
                        <div className="p-6 bg-indigo-50 rounded-2xl border-2 border-indigo-100 text-center italic font-black text-indigo-600 text-lg shadow-inner">
                          "{entryPoint} — {coord1.side} {coord1.point?.name} — {coord2.side} {coord2.point?.name}"
                        </div>
                        <p className="text-xs text-slate-400 font-medium text-center">Hold until you feel a therapeutic pulse or shift in tone.</p>
                      </div>
                    )}
                    {method === 'Tuning Fork' && (
                      <p className="text-2xl font-black leading-tight text-slate-900">
                        Therapy localize both points and strike tuning fork on the <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">Cranium</span>.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('METHOD')} className="flex-1 h-14 rounded-2xl font-bold">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button onClick={() => nextStep('REASSESS')} className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200">
                Calibration Complete <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'REASSESS' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-emerald-50 p-10 rounded-[3rem] border-2 border-emerald-100 text-center shadow-inner">
              <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center mx-auto mb-8">
                <RefreshCw size={56} className="text-emerald-500" />
              </div>
              <h3 className="text-3xl font-black text-emerald-900 mb-3">Final Re-assessment</h3>
              <p className="text-emerald-700 font-bold text-lg">
                Re-stimulate the original pathway <span className="font-black underline decoration-emerald-300 underline-offset-4">"{entryPoint}"</span> and test the IM.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <Button 
                className="h-20 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-2xl font-black shadow-xl shadow-emerald-100"
                onClick={handleComplete}
              >
                Pathway is Clear <CheckCircle2 size={28} className="ml-3" />
              </Button>
              <Button 
                variant="outline" 
                className="h-16 rounded-2xl border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-black text-xs uppercase tracking-widest"
                onClick={() => nextStep('COORD_1')}
              >
                Still Inhibited - Find New Zones
              </Button>
            </div>
            
            <Button variant="ghost" onClick={() => prevStep('CALIBRATE')} className="w-full h-12 rounded-xl font-bold">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EfferentBrainIntegration;