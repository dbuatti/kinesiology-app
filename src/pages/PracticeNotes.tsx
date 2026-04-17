"use client";

import React, { useState, useEffect } from "react";
import { MUSCLE_INFO_DETAILS } from "@/data/muscle-info-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Printer, 
  RotateCcw, 
  FileText, 
  Zap, 
  Baby, 
  Brain, 
  Activity, 
  Hand, 
  PlayCircle, 
  ShieldAlert,
  Loader2,
  Calendar,
  Sparkles,
  Layers,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "practice_notes_checked_items";

const PracticeNotes = () => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [customImages, setCustomImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Load checked items and custom images
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCheckedItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse checked items", e);
      }
    }

    const fetchImages = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [brainRes, reflexRes] = await Promise.all([
          supabase.from('brain_reflex_customizations').select('reflex_id, image_url, secondary_image_url').eq('user_id', user.id),
          supabase.from('primitive_reflex_customizations').select('reflex_id, image_url').eq('user_id', user.id)
        ]);

        const mapping: Record<string, string> = {};
        brainRes.data?.forEach(item => {
          if (item.secondary_image_url || item.image_url) {
            mapping[item.reflex_id] = item.secondary_image_url || item.image_url;
          }
        });
        reflexRes.data?.forEach(item => {
          if (item.image_url) {
            mapping[item.reflex_id] = item.image_url;
          }
        });
        setCustomImages(mapping);
      } catch (err) {
        console.error("Failed to fetch images:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedItems));
  }, [checkedItems]);

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const resetDocument = () => {
    if (window.confirm("Are you sure you want to clear all notes and checkboxes?")) {
      setCheckedItems({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper components defined inside to access state
  const Section = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
    <section className={cn("mb-12 break-inside-avoid", className)}>
      <h2 className="text-2xl font-serif font-black border-b-4 border-slate-900 pb-2 mb-6 text-slate-900 uppercase tracking-tighter">
        {title}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );

  const Item = ({ id, label, subtext, bold = false, indent = false }: { id: string; label: string; subtext?: string; bold?: boolean; indent?: boolean }) => (
    <div className={cn("flex items-start gap-4 group", indent && "ml-10")}>
      <Checkbox 
        id={id} 
        checked={!!checkedItems[id]} 
        onCheckedChange={() => toggleItem(id)}
        className="mt-1.5 h-5 w-5 border-slate-400 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
      />
      <div className="grid gap-1 leading-tight">
        <label
          htmlFor={id}
          className={cn(
            "text-base font-semibold cursor-pointer select-none transition-colors",
            bold ? "font-black text-slate-900 text-lg" : "text-slate-800",
            checkedItems[id] && "line-through text-slate-400"
          )}
        >
          {label}
        </label>
        {subtext && (
          <p className={cn("text-sm text-slate-500 font-medium leading-relaxed", checkedItems[id] && "text-slate-300")}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );

  const ReflexCard = ({ reflex }: { reflex: any }) => {
    const imageUrl = customImages[reflex.id];
    return (
      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 mb-4 break-inside-avoid">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <Checkbox 
              id={`reflex-${reflex.id}`} 
              checked={!!checkedItems[`reflex-${reflex.id}`]} 
              onCheckedChange={() => toggleItem(`reflex-${reflex.id}`)}
              className="h-5 w-5 border-slate-400"
            />
            <div>
              <h3 className={cn("font-black text-lg text-slate-900", checkedItems[`reflex-${reflex.id}`] && "line-through text-slate-400")}>
                {reflex.name}
              </h3>
              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-300">{reflex.category}</Badge>
            </div>
          </div>
          <Baby size={20} className="text-indigo-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <PlayCircle size={14} className="text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-slate-700"><span className="uppercase text-[9px] font-black text-slate-400 block">Stimulus</span> {reflex.stimulus}</p>
            </div>
            <div className="flex items-start gap-2">
              <ShieldAlert size={14} className="text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-slate-700"><span className="uppercase text-[9px] font-black text-slate-400 block">Inhibition Pattern</span> {reflex.inhibitionPattern}</p>
            </div>
            <div className="flex items-start gap-2">
              <Hand size={14} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 italic"><span className="uppercase text-[9px] font-black text-slate-400 block">How to Assess</span> {reflex.howTo}</p>
            </div>
          </div>
          
          {imageUrl && (
            <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-inner">
              <img src={imageUrl} alt={reflex.name} className="w-full h-full object-cover opacity-90" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const NerveCard = ({ nerve }: { nerve: any }) => {
    const imageUrl = customImages[`cn${nerve.id}`];
    return (
      <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm mb-4 break-inside-avoid">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <Checkbox 
              id={`cn-${nerve.id}`} 
              checked={!!checkedItems[`cn-${nerve.id}`]} 
              onCheckedChange={() => toggleItem(`cn-${nerve.id}`)}
              className="h-5 w-5 border-slate-400"
            />
            <div>
              <h3 className={cn("font-black text-lg text-slate-900", checkedItems[`cn-${nerve.id}`] && "line-through text-slate-400")}>
                {nerve.name}: {nerve.latinName}
              </h3>
              <Badge className={cn("text-[8px] font-black uppercase tracking-widest border-none", 
                nerve.nuclei === 'Pons' ? "bg-indigo-100 text-indigo-700" : 
                nerve.nuclei === 'Medulla' ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
              )}>
                {nerve.nuclei} Nuclei
              </Badge>
            </div>
          </div>
          <Zap size={20} className="text-amber-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Hand size={14} className="text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-slate-700"><span className="uppercase text-[9px] font-black text-slate-400 block">Reflex Point</span> {nerve.reflexPoint}</p>
            </div>
            <div className="flex items-start gap-2">
              <PlayCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-slate-700"><span className="uppercase text-[9px] font-black text-slate-400 block">Stimulus</span> {nerve.stimulus}</p>
            </div>
          </div>
          
          {imageUrl && (
            <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
              <img src={imageUrl} alt={nerve.name} className="w-full h-full object-cover opacity-80" />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Practice Notes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 print:bg-white print:py-0 print:px-0">
      {/* Stealth Toolbar */}
      <div className="max-w-[1100px] mx-auto mb-8 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <FileText size={20} className="text-indigo-600" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-[0.2em] block">Clinical Practice Notes</span>
            <span className="text-[10px] font-medium text-slate-400">Comprehensive Assessment Guide</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={resetDocument} className="h-10 px-6 rounded-xl text-xs font-bold gap-2 border-slate-200 bg-white hover:bg-slate-50">
            <RotateCcw size={16} /> Reset Document
          </Button>
          <Button variant="default" size="sm" onClick={handlePrint} className="h-10 px-8 rounded-xl text-xs font-black uppercase tracking-widest gap-2 bg-slate-900 hover:bg-black shadow-lg">
            <Printer size={16} /> Print Notes
          </Button>
        </div>
      </div>

      {/* Document Container */}
      <div className="max-w-[1100px] mx-auto bg-white shadow-2xl border border-slate-200 p-16 md:p-24 min-h-[1056px] print:shadow-none print:border-none print:p-0">
        
        {/* Document Header */}
        <header className="mb-20 text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-12 opacity-5">
            <Brain size={120} />
          </div>
          <h1 className="text-5xl font-serif font-black text-slate-900 mb-4 tracking-tighter">Clinical Practice Notes</h1>
          <p className="text-slate-400 text-sm font-black uppercase tracking-[0.5em]">PEACE Process & Neurological Assessment</p>
          <div className="mt-12 flex justify-center gap-12 text-xs font-bold text-slate-400 border-y-2 border-slate-100 py-6">
            <span className="flex items-center gap-2"><Calendar size={14} /> Date: ____________________</span>
            <span className="flex items-center gap-2"><Activity size={14} /> Practitioner: ____________________</span>
            <span className="flex items-center gap-2"><Hand size={14} /> Client ID: ____________________</span>
          </div>
        </header>

        {/* 1. PEACE Process */}
        <Section title="I. The PEACE Process">
          <div className="grid grid-cols-1 gap-6">
            <Item id="p-step" label="P - Preliminary Assessment" subtext="Gather the story, run the baseline (BOLT/Coherence), and identify how the system is currently organised." bold />
            <Item id="e1-step" label="E - Ease the System" subtext="Create safety before change. Address SNS dominance (Harmonic Rocking, T1, Diaphragm). Ease must come before correction." bold />
            <Item id="a-step" label="A - Align the Hierarchy" subtext="Find the keystone — the true priority that the nervous system wants to address first (Reflexes, Nerves, Muscles)." bold />
            <Item id="c-step" label="C - Correct" subtext="Facilitate the primary change. Use Afferent (Bottom-Up) or Efferent (Top-Down) logic to reset the circuit." bold />
            <Item id="e2-step" label="E - Embed" subtext="Stabilise and integrate so change becomes lasting transformation. Prescribe specific neurological homework." bold />
          </div>
        </Section>

        {/* 2. Clinical Hierarchy */}
        <Section title="II. Clinical Hierarchy">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-500" /> Asterisk Tier
              </h3>
              <Item id="h-emotional" label="Emotional Charge" />
              <Item id="h-assemblage" label="Assemblage Point" />
              <Item id="h-hara" label="Hara Line" />
              <Item id="h-heartwall" label="Heart Wall" />
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Zap size={14} className="text-indigo-500" /> 1° Primary Tier
              </h3>
              <Item id="h-primitive" label="Primitive Reflexes" />
              <Item id="h-nociception" label="Nociception" />
              <Item id="h-cranial" label="Cranial Nerves" />
              <Item id="h-eyes" label="Eye Systems" />
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Activity size={14} className="text-emerald-500" /> 2° Secondary Tier
              </h3>
              <Item id="h-immune" label="Immune Vials (TH1/2/17/9)" />
              <Item id="h-infections" label="Infections" />
              <Item id="h-krebs" label="Krebs Cycle" />
              <Item id="h-organ" label="Organ/Gland Balance" />
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Layers size={14} className="text-amber-500" /> 3° Tertiary Tier
              </h3>
              <Item id="h-icv" label="Ileocecal Valve (ICV)" />
              <Item id="h-cranialbones" label="Cranial Bones" />
              <Item id="h-musculo" label="Musculoskeletal" />
            </div>
          </div>
        </Section>

        {/* 3. Preliminary & SNS Resets */}
        <Section title="III. Preliminary & SNS Resets">
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Preliminary Vitals</h3>
                <Item id="v-bolt" label="BOLT Score" subtext="Measure CO2 tolerance. Target: 25s+ (Functional), 40s+ (Optimal). Low score = Imperative Breathing Recovery." />
                <Item id="v-coherence" label="Heart Coherence" subtext="Autonomic sync. HR/BR ratio. Check for coherence vs discordance. High ratio = High stress." />
              </div>
              <div className="p-6 bg-indigo-900 text-white rounded-[2rem] shadow-xl">
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-2">Practitioner Rule</h4>
                <p className="text-sm italic leading-relaxed">"If the client's BOLT score is below 25s, the system is in a state of chronic threat. Deep work will not stick until CO2 tolerance is improved."</p>
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">SNS Down-Regulation Procedures</h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-4">
                  <Item id="sns-t1-main" label="T1 Sympathetic Reset" bold />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-10">
                    <p className="text-xs text-slate-600 font-medium">1. Palpate bilateral anterior first rib (T1) to find restricted/tender side.</p>
                    <p className="text-xs text-slate-600 font-medium">2. Test contralateral Psoas muscle (should be inhibited).</p>
                    <p className="text-xs text-slate-600 font-medium">3. Monitor tender spot; move ipsilateral shoulder into external rotation.</p>
                    <p className="text-xs text-slate-600 font-medium">4. Hold for 45-90s until tenderness dissolves. Re-assess Psoas.</p>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-4">
                  <Item id="sns-diaphragm-main" label="Diaphragm Reset" bold />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-10">
                    <p className="text-xs text-slate-600 font-medium">1. Challenge tender points either side of sternum (Phrenic nerve).</p>
                    <p className="text-xs text-slate-600 font-medium">2. Palpate neck at C4 level (usually opposite to sternum tender point).</p>
                    <p className="text-xs text-slate-600 font-medium">3. Move ribcage superiorly towards neck. Hold for 45-90s.</p>
                    <p className="text-xs text-slate-600 font-medium">4. Release very slowly. Observe for deep sigh or yawn.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 4. Primitive Reflexes */}
        <Section title="IV. Primitive Reflexes (Foundational OS)">
          <div className="grid grid-cols-1 gap-4">
            {PRIMITIVE_REFLEXES.map(reflex => (
              <ReflexCard key={reflex.id} reflex={reflex} />
            ))}
          </div>
        </Section>

        {/* 5. Cranial Nerves */}
        <Section title="V. Cranial Nerves (Brainstem Pathways)">
          <div className="grid grid-cols-1 gap-4">
            {CRANIAL_NERVES.map(cn => (
              <NerveCard key={cn.id} nerve={cn} />
            ))}
          </div>
        </Section>

        {/* 6. Key Muscles */}
        <Section title="VI. Key Muscles (Clinical Indicators)">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6">
            {Object.values(MUSCLE_INFO_DETAILS).filter(m => m.videoUrl).map(muscle => (
              <div key={muscle.name} className="flex items-center gap-3">
                <Checkbox id={`muscle-${muscle.name}`} onCheckedChange={() => toggleItem(`muscle-${muscle.name}`)} checked={!!checkedItems[`muscle-${muscle.name}`]} />
                <div>
                  <p className={cn("text-sm font-bold text-slate-900", checkedItems[`muscle-${muscle.name}`] && "line-through text-slate-400")}>{muscle.name}</p>
                  <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{muscle.meridian} Meridian</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer Notes */}
        <div className="mt-20 pt-12 border-t-4 border-slate-900">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Clinical Observations & Integration Notes</h3>
          <div className="space-y-10">
            <div className="h-px bg-slate-200 w-full" />
            <div className="h-px bg-slate-200 w-full" />
            <div className="h-px bg-slate-200 w-full" />
            <div className="h-px bg-slate-200 w-full" />
            <div className="h-px bg-slate-200 w-full" />
            <div className="h-px bg-slate-200 w-full" />
          </div>
        </div>

        <footer className="mt-24 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            <ShieldCheck size={14} className="text-emerald-400" /> Confidential Clinical Document
          </div>
          <p className="text-slate-300 text-[8px] font-bold uppercase tracking-widest">For Professional Use Only • Resonance Kinesiology Practice Management</p>
        </footer>
      </div>
    </div>
  );
};

export default PracticeNotes;