"use client";

import React, { useState, useEffect } from "react";
import { CRANIAL_NERVES, CranialNerve, BrainstemNuclei } from "@/data/cranial-nerve-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Zap, 
  Activity, 
  Brain, 
  Info, 
  ArrowRight, 
  ShieldAlert,
  Hand,
  PlayCircle,
  Layers,
  Workflow,
  Sparkles,
  ImageIcon,
  Target
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface ReflexImageData {
  primaryUrl: string | null;
  secondaryUrl: string | null;
}

const CranialNerveReference = () => {
  const [search, setSearch] = useState("");
  const [selectedNuclei, setSelectedNuclei] = useState<BrainstemNuclei | 'All'>('All');
  const [customizations, setCustomizations] = useState<Record<string, ReflexImageData>>({});
  const [loadingImages, setLoadingImages] = useState(true);

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
        
        const mapping: Record<string, ReflexImageData> = {};
        data?.forEach(item => { 
          const timestamp = Date.now();
          mapping[item.reflex_id] = {
            primaryUrl: item.image_url ? `${item.image_url}?t=${timestamp}` : null,
            secondaryUrl: item.secondary_image_url ? `${item.secondary_image_url}?t=${timestamp}` : null
          };
        });
        setCustomizations(mapping);
      } catch (err) {
        console.error("Failed to fetch customizations:", err);
      } finally {
        setLoadingImages(false);
      }
    };
    fetchCustomizations();
  }, []);

  const filteredNerves = CRANIAL_NERVES.filter(n => {
    const matchesSearch = n.name.toLowerCase().includes(search.toLowerCase()) || 
                         n.latinName.toLowerCase().includes(search.toLowerCase()) ||
                         n.stimulus.toLowerCase().includes(search.toLowerCase());
    const matchesNuclei = selectedNuclei === 'All' || n.nuclei === selectedNuclei;
    return matchesSearch && matchesNuclei;
  });

  const nucleiOptions: (BrainstemNuclei | 'All')[] = ['All', 'Cortex', 'Midbrain', 'Pons', 'Medulla'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search nerves (e.g. Vagus, CN V, Smell)..." 
            className="pl-12 bg-white border-slate-200 rounded-2xl h-14 shadow-sm font-medium focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {nucleiOptions.map(opt => (
            <Button 
              key={opt}
              variant={selectedNuclei === opt ? "default" : "outline"}
              onClick={() => setSelectedNuclei(opt)}
              className={cn(
                "rounded-xl h-14 px-6 font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all",
                selectedNuclei === opt ? "bg-slate-900 shadow-lg" : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              {opt}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredNerves.map(nerve => {
          const reflexId = `cn${nerve.id}`;
          const data = customizations[reflexId] || { primaryUrl: null, secondaryUrl: null };

          return (
            <Card key={nerve.id} className="border-none shadow-lg rounded-[2.5rem] bg-white hover:shadow-2xl transition-all group overflow-hidden">
              <CardHeader className={cn(
                "pb-6 border-b transition-colors relative",
                nerve.nuclei === 'Cortex' ? "bg-purple-50/50 border-purple-100" :
                nerve.nuclei === 'Midbrain' ? "bg-amber-50/50 border-amber-100" :
                nerve.nuclei === 'Pons' ? "bg-indigo-50/50 border-indigo-100" :
                "bg-rose-50/50 border-rose-100"
              )}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex gap-2 mb-2">
                      <Badge className={cn(
                        "border-none font-black text-[8px] uppercase tracking-widest",
                        nerve.nuclei === 'Cortex' ? "bg-purple-100 text-purple-700" :
                        nerve.nuclei === 'Midbrain' ? "bg-amber-100 text-amber-700" :
                        nerve.nuclei === 'Pons' ? "bg-indigo-100 text-indigo-700" :
                        "bg-rose-100 text-rose-700"
                      )}>
                        {nerve.nuclei} Nuclei
                      </Badge>
                      <Badge variant="outline" className="border-slate-200 text-slate-500 font-black text-[8px] uppercase tracking-widest">
                        {nerve.toneEffect} Tone
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {nerve.name}: {nerve.latinName}
                    </CardTitle>
                  </div>
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-white",
                    nerve.color
                  )}>
                    <Zap size={24} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {/* Images Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <ImageIcon size={10} /> Anatomy
                    </p>
                    <div className="aspect-video rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shadow-inner">
                      {data.primaryUrl ? (
                        <img src={data.primaryUrl} alt="Anatomy" className="w-full h-full object-cover" />
                      ) : (
                        <Brain size={20} className="text-slate-200" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Target size={10} /> Reflex
                    </p>
                    <div className="aspect-video rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shadow-inner">
                      {data.secondaryUrl ? (
                        <img src={data.secondaryUrl} alt="Reflex" className="w-full h-full object-cover" />
                      ) : (
                        <Target size={20} className="text-slate-200" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Hand size={12} /> Reflex Point
                    </p>
                    <p className="text-sm font-bold text-slate-900">{nerve.reflexPoint}</p>
                  </div>
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <PlayCircle size={12} /> Stimulus
                    </p>
                    <p className="text-sm font-bold text-indigo-900">{nerve.stimulus}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Primary Functions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {nerve.functions.map(f => (
                      <Badge key={f} variant="secondary" className="bg-slate-100 text-slate-600 border-none text-[10px] font-bold">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={40} className="text-amber-600" /></div>
                  <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Info size={14} /> Clinical Pearl
                  </p>
                  <p className="text-xs text-amber-900 font-bold leading-relaxed">
                    {nerve.clinicalPearl}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-none shadow-lg rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
        <CardContent className="p-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-500/40">
            <Workflow size={48} className="text-white" />
          </div>
          <div className="space-y-4">
            <h4 className="text-2xl font-black flex items-center gap-3">
              <ShieldAlert size={24} className="text-indigo-400" /> The Fractal Correction Logic
            </h4>
            <p className="text-slate-400 font-medium leading-relaxed text-lg">
              "You may have a whole heap of cranial nerves that come up and you may need to only do one or two corrections to clear the whole pattern or the whole fractal."
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-xs font-bold text-slate-300">Pons = Extensors (CN 5-8)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-xs font-bold text-slate-300">Medulla = Flexors (CN 9-12)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-slate-300">Midbrain = Flexors (CN 3-4)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CranialNerveReference;