"use client";

import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAIN_REFLEX_POINTS, BrainReflexPoint } from '@/data/brain-reflex-data';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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

const EfferentBrainIntegration = ({ onSave, onCancel, initialValue, initialEntryPoint }: EfferentBrainIntegrationProps) => {
  const [step, setStep] = useState<Step>(initialEntryPoint ? 'COORD_1' : 'ENTRY');
  const [entryPoint, setEntryPoint] = useState(initialEntryPoint || "");
  const [coord1, setCoord1] = useState<Coordinate>({ point: null, side: null });
  const [coord2, setCoord2] = useState<Coordinate>({ point: null, side: null });
  const [method, setMethod] = useState<IntegrationMethod | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [customizations, setCustomizations] = useState<Record<string, ReflexImages>>({});
  const [loadingImages, setLoadingImages] = useState(false);

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

  const corticalPoints = BRAIN_REFLEX_POINTS.filter(p => p.category === 'Cortical');
  const subcorticalPoints = BRAIN_REFLEX_POINTS.filter(p => p.category === 'Subcortical');

  const handleComplete = () => {
    const summary = `Efferent Integration: ${entryPoint} -> ${coord1.side} ${coord1.point?.name} + ${coord2.side} ${coord2.point?.name} via ${method}`;
    onSave(summary);
    setIsComplete(true);
  };

  const renderImagePreview = (pointId: string) => {
    const images = customizations[pointId];
    if (!images || (!images.primaryUrl && !images.secondaryUrl)) return null;

    return (
      <div className="grid grid-cols-2 gap-3 mt-4 animate-in fade-in zoom-in-95 duration-500">
        {images.primaryUrl && (
          <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group">
            <img src={images.primaryUrl} alt="Anatomy" className="w-full h-full object-cover" />
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[8px] font-black text-white uppercase tracking-widest">Anatomy</div>
          </div>
        )}
        {images.secondaryUrl && (
          <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group">
            <img src={images.secondaryUrl} alt="Reflex" className="w-full h-full object-cover" />
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-indigo-600/80 backdrop-blur-sm rounded text-[8px] font-black text-white uppercase tracking-widest">Reflex Point</div>
          </div>
        )}
      </div>
    );
  };

  const renderCoordinateSelection = (coord: Coordinate, setCoord: (c: Coordinate) => void, next: Step, prev: Step, title: string) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-2">
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">Select the brain zone and lateralize the response.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cortical Zones</p>
          <div className="flex flex-wrap gap-2">
            {corticalPoints.map(p => (
              <Button 
                key={p.id} 
                variant={coord.point?.id === p.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCoord({ ...coord, point: p })}
                className={cn("rounded-xl font-bold text-xs h-9", coord.point?.id === p.id ? "bg-purple-600" : "border-slate-200")}
              >
                {p.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subcortical Zones</p>
          <div className="flex flex-wrap gap-2">
            {subcorticalPoints.map(p => (
              <Button 
                key={p.id} 
                variant={coord.point?.id === p.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCoord({ ...coord, point: p })}
                className={cn("rounded-xl font-bold text-xs h-9", coord.point?.id === p.id ? "bg-indigo-600" : "border-slate-200")}
              >
                {p.name}
              </Button>
            ))}
          </div>
        </div>

        {coord.point && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lateralize Response</p>
              <Badge className="bg-white text-slate-900 border-slate-200 font-bold">{coord.point.name}</Badge>
            </div>
            <ToggleGroup type="single" value={coord.side || ""} onValueChange={(v) => v && setCoord({ ...coord, side: v as any })} className="justify-start gap-2">
              <ToggleGroupItem value="Left" className="flex-1 rounded-xl border-2 data-[state=on]:bg-slate-900 data-[state=on]:text-white font-bold">Left</ToggleGroupItem>
              <ToggleGroupItem value="Right" className="flex-1 rounded-xl border-2 data-[state=on]:bg-slate-900 data-[state=on]:text-white font-bold">Right</ToggleGroupItem>
              <ToggleGroupItem value="Bilateral" className="flex-1 rounded-xl border-2 data-[state=on]:bg-slate-900 data-[state=on]:text-white font-bold">Bilateral</ToggleGroupItem>
            </ToggleGroup>
            
            {renderImagePreview(coord.point.id)}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="ghost" onClick={() => prevStep(prev)} className="flex-1 h-12 rounded-xl">
          <ChevronLeft size={18} className="mr-2" /> Back
        </Button>
        <Button 
          disabled={!coord.point || !coord.side}
          onClick={() => nextStep(next)} 
          className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold"
        >
          Continue <ChevronRight size={18} className="ml-2" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 rounded-full">
        <div 
          className="h-full bg-indigo-600 transition-all duration-700 ease-out rounded-full" 
          style={{ 
            width: `${(
              ['ENTRY', 'COORD_1', 'COORD_2', 'METHOD', 'CALIBRATE', 'REASSESS'].indexOf(step) + 1
            ) / 6 * 100}%` 
          }} 
        />
      </div>

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

      <div className="flex flex-col justify-center">
        {step === 'ENTRY' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Entry Pathway</h3>
              <p className="text-sm text-slate-500">What stimulus brought you into this efferent correction?</p>
            </div>
            <Input 
              placeholder="e.g. Left Psoas, Fear Paralysis Reflex..." 
              className="h-14 rounded-xl border-2 border-slate-100 focus:border-indigo-500 transition-all text-lg font-medium"
              value={entryPoint}
              onChange={(e) => setEntryPoint(e.target.value)}
            />
            <Button 
              disabled={!entryPoint}
              onClick={() => nextStep('COORD_1')}
              className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-lg font-bold shadow-lg shadow-indigo-200"
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
              <p className="text-sm text-slate-500">Challenge the system to find the preferred integration method.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'Tapping', icon: Zap, color: 'text-amber-500', desc: 'Simultaneous tapping for 3-5 seconds.' },
                { id: 'Holding + Intention', icon: Heart, color: 'text-rose-500', desc: 'Light hold + mental repetition of zones.' },
                { id: 'Tuning Fork', icon: Activity, color: 'text-blue-500', desc: 'Vibrational reset on the cranium.' }
              ].map((m) => (
                <Button
                  key={m.id}
                  variant="outline"
                  className={cn(
                    "h-20 justify-start gap-4 px-6 rounded-2xl border-2 transition-all",
                    method === m.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-indigo-200"
                  )}
                  onClick={() => {
                    setMethod(m.id as IntegrationMethod);
                    nextStep('CALIBRATE');
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <m.icon size={20} className={m.color} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">{m.id}</div>
                    <div className="text-xs opacity-70">{m.desc}</div>
                  </div>
                </Button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => prevStep('COORD_2')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        )}

        {step === 'CALIBRATE' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Sparkles size={150} /></div>
              <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Zap size={28} className="text-amber-400 fill-amber-400" /> 
                Calibration Phase
              </h3>
              
              <div className="space-y-8 relative z-10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-center">
                      <p className="text-[10px] font-black text-indigo-300 uppercase mb-1">Coordinate 1</p>
                      <p className="text-lg font-bold">{coord1.side} {coord1.point?.name}</p>
                    </div>
                    {coord1.point && customizations[coord1.point.id]?.secondaryUrl && (
                      <div className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-white/5">
                        <img src={customizations[coord1.point.id].secondaryUrl!} alt="Reflex 1" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-center">
                      <p className="text-[10px] font-black text-indigo-300 uppercase mb-1">Coordinate 2</p>
                      <p className="text-lg font-bold">{coord2.side} {coord2.point?.name}</p>
                    </div>
                    {coord2.point && customizations[coord2.point.id]?.secondaryUrl && (
                      <div className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-white/5">
                        <img src={customizations[coord2.point.id].secondaryUrl!} alt="Reflex 2" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-white rounded-3xl text-slate-900 shadow-xl">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Instructions</p>
                  <div className="space-y-4">
                    {method === 'Tapping' && (
                      <p className="text-lg font-bold leading-tight">
                        Simultaneously <span className="text-indigo-600">TAP</span> both reflex points for 3-5 seconds.
                      </p>
                    )}
                    {method === 'Holding + Intention' && (
                      <div className="space-y-4">
                        <p className="text-lg font-bold leading-tight">
                          Hold both points lightly and mentally repeat:
                        </p>
                        <div className="p-4 bg-indigo-50 rounded-xl border-2 border-indigo-100 text-center italic font-black text-indigo-600">
                          "{entryPoint} — {coord1.point?.name} — {coord2.point?.name}"
                        </div>
                      </div>
                    )}
                    {method === 'Tuning Fork' && (
                      <p className="text-lg font-bold leading-tight">
                        Therapy localize both points and strike tuning fork on the <span className="text-indigo-600">Cranium</span>.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => prevStep('METHOD')} className="flex-1 h-12 rounded-xl">
                <ChevronLeft size={18} className="mr-2" /> Back
              </Button>
              <Button onClick={() => nextStep('REASSESS')} className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold">
                Calibration Complete <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'REASSESS' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-emerald-50 p-8 rounded-[2.5rem] border-2 border-emerald-100 text-center">
              <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6">
                <RefreshCw size={48} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-emerald-900 mb-2">Final Re-assessment</h3>
              <p className="text-emerald-700 font-medium">
                Re-stimulate the original pathway <span className="font-black underline">"{entryPoint}"</span> and test the IM.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <Button 
                className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xl font-black shadow-lg shadow-emerald-100"
                onClick={handleComplete}
              >
                Pathway is Clear <CheckCircle2 size={24} className="ml-2" />
              </Button>
              <Button 
                variant="outline" 
                className="h-16 rounded-2xl border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-lg"
                onClick={() => nextStep('COORD_1')}
              >
                Still Inhibited - Find New Zones
              </Button>
            </div>
            
            <Button variant="ghost" onClick={() => prevStep('CALIBRATE')} className="w-full h-12 rounded-xl">
              <ChevronLeft size={18} className="mr-2" /> Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EfferentBrainIntegration;