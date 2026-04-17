"use client";

import React, { useState, useEffect } from "react";
import { MUSCLE_INFO_DETAILS } from "@/data/muscle-info-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "practice_notes_checked_items";

const PracticeNotes = () => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [customImages, setCustomImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

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

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-10 break-inside-avoid">
      <h2 className="text-xl font-serif font-bold border-b border-black pb-1 mb-4 text-black uppercase">
        {title}
      </h2>
      <div className="space-y-3">
        {children}
      </div>
    </section>
  );

  const Item = ({ id, label, subtext, bold = false }: { id: string; label: string; subtext?: string; bold?: boolean }) => (
    <div className="flex items-start gap-3">
      <Checkbox 
        id={id} 
        checked={!!checkedItems[id]} 
        onCheckedChange={() => toggleItem(id)}
        className="mt-1 h-4 w-4 border-black rounded-none"
      />
      <div className="grid gap-0.5">
        <label
          htmlFor={id}
          className={cn(
            "text-sm cursor-pointer select-none",
            bold ? "font-bold" : "font-normal",
            checkedItems[id] && "line-through text-gray-400"
          )}
        >
          {label}
        </label>
        {subtext && (
          <p className={cn("text-xs text-gray-600 leading-relaxed", checkedItems[id] && "text-gray-300")}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );

  const ReflexCard = ({ reflex }: { reflex: any }) => {
    const imageUrl = customImages[reflex.id];
    return (
      <div className="p-4 border border-black mb-4 break-inside-avoid">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <Checkbox 
              id={`reflex-${reflex.id}`} 
              checked={!!checkedItems[`reflex-${reflex.id}`]} 
              onCheckedChange={() => toggleItem(`reflex-${reflex.id}`)}
              className="h-4 w-4 border-black rounded-none"
            />
            <h3 className={cn("font-bold text-base", checkedItems[`reflex-${reflex.id}`] && "line-through text-gray-400")}>
              {reflex.name} ({reflex.category})
            </h3>
          </div>
        </div>
        
        <div className="flex gap-6">
          <div className="flex-1 space-y-2 text-xs">
            <p><strong>Stimulus:</strong> {reflex.stimulus}</p>
            <p><strong>Inhibition Pattern:</strong> {reflex.inhibitionPattern}</p>
            <p className="italic text-gray-600"><strong>Assessment:</strong> {reflex.howTo}</p>
          </div>
          
          {imageUrl && (
            <div className="w-32 h-24 border border-gray-300 p-0.5 shrink-0">
              <img src={imageUrl} alt={reflex.name} className="w-full h-full object-cover grayscale contrast-125" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const NerveCard = ({ nerve }: { nerve: any }) => {
    const imageUrl = customImages[`cn${nerve.id}`];
    return (
      <div className="p-4 border border-black mb-4 break-inside-avoid">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <Checkbox 
              id={`cn-${nerve.id}`} 
              checked={!!checkedItems[`cn-${nerve.id}`]} 
              onCheckedChange={() => toggleItem(`cn-${nerve.id}`)}
              className="h-4 w-4 border-black rounded-none"
            />
            <h3 className={cn("font-bold text-base", checkedItems[`cn-${nerve.id}`] && "line-through text-gray-400")}>
              {nerve.name}: {nerve.latinName} ({nerve.nuclei} Nuclei)
            </h3>
          </div>
        </div>
        
        <div className="flex gap-6">
          <div className="flex-1 space-y-2 text-xs">
            <p><strong>Reflex Point:</strong> {nerve.reflexPoint}</p>
            <p><strong>Stimulus:</strong> {nerve.stimulus}</p>
          </div>
          
          {imageUrl && (
            <div className="w-32 h-24 border border-gray-300 p-0.5 shrink-0">
              <img src={imageUrl} alt={nerve.name} className="w-full h-full object-cover grayscale contrast-125" />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="animate-spin text-black" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest">Loading Document...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 print:bg-white print:py-0 print:px-0">
      {/* Toolbar */}
      <div className="max-w-[1200px] mx-auto mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2 text-gray-500">
          <span className="text-xs font-bold uppercase tracking-widest">Clinical Practice Notes</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={resetDocument} className="h-9 px-4 text-xs border-gray-300 bg-white hover:bg-gray-50 rounded-none">
            Reset
          </Button>
          <Button variant="default" size="sm" onClick={handlePrint} className="h-9 px-6 text-xs font-bold bg-black text-white hover:bg-gray-800 rounded-none">
            Print Document
          </Button>
        </div>
      </div>

      {/* Document Container */}
      <div className="max-w-[1200px] mx-auto bg-white border border-gray-300 p-16 md:p-20 min-h-[1056px] print:border-none print:p-0 text-black font-sans">
        
        {/* Document Header */}
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-serif font-bold mb-2 tracking-tight">Clinical Practice Notes</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em]">PEACE Process & Neurological Assessment Guide</p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-xs font-bold border-y border-black py-4">
            <span>Date: ____________________</span>
            <span>Practitioner: ____________________</span>
            <span>Client ID: ____________________</span>
          </div>
        </header>

        {/* 1. PEACE Process */}
        <Section title="I. The PEACE Process">
          <div className="space-y-4">
            <Item id="p-step" label="P - Preliminary Assessment" subtext="Gather the story, run the baseline (BOLT/Coherence), and identify how the system is currently organised." bold />
            <Item id="e1-step" label="E - Ease the System" subtext="Create safety before change. Address SNS dominance (Harmonic Rocking, T1, Diaphragm). Ease must come before correction." bold />
            <Item id="a-step" label="A - Align the Hierarchy" subtext="Find the keystone — the true priority that the nervous system wants to address first (Reflexes, Nerves, Muscles)." bold />
            <Item id="c-step" label="C - Correct" subtext="Facilitate the primary change. Use Afferent (Bottom-Up) or Efferent (Top-Down) logic to reset the circuit." bold />
            <Item id="e2-step" label="E - Embed" subtext="Stabilise and integrate so change becomes lasting transformation. Prescribe specific neurological homework." bold />
          </div>
        </Section>

        {/* 2. Clinical Hierarchy */}
        <Section title="II. Clinical Hierarchy">
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Asterisk Tier</h3>
              <Item id="h-emotional" label="Emotional Charge" />
              <Item id="h-assemblage" label="Assemblage Point" />
              <Item id="h-hara" label="Hara Line" />
              <Item id="h-heartwall" label="Heart Wall" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">1. Primary Tier</h3>
              <Item id="h-primitive" label="Primitive Reflexes" />
              <Item id="h-nociception" label="Nociception" />
              <Item id="h-cranial" label="Cranial Nerves" />
              <Item id="h-eyes" label="Eye Systems" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">2. Secondary Tier</h3>
              <Item id="h-immune" label="Immune Vials (TH1/2/17/9)" />
              <Item id="h-infections" label="Infections" />
              <Item id="h-krebs" label="Krebs Cycle" />
              <Item id="h-organ" label="Organ/Gland Balance" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">3. Tertiary Tier</h3>
              <Item id="h-icv" label="Ileocecal Valve (ICV)" />
              <Item id="h-cranialbones" label="Cranial Bones" />
              <Item id="h-musculo" label="Musculoskeletal" />
            </div>
          </div>
        </Section>

        {/* 3. Preliminary & SNS Resets */}
        <Section title="III. Preliminary & SNS Resets">
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-x-12">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Preliminary Vitals</h3>
                <Item id="v-bolt" label="BOLT Score" subtext="Measure CO2 tolerance. Target: 25s+ (Functional), 40s+ (Optimal)." />
                <Item id="v-coherence" label="Heart Coherence" subtext="Autonomic sync. HR/BR ratio. Check for coherence vs discordance." />
              </div>
              <div className="p-4 border border-black italic text-xs leading-relaxed">
                "If the client's BOLT score is below 25s, the system is in a state of chronic threat. Deep work will not stick until CO2 tolerance is improved."
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">SNS Down-Regulation Procedures</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 border border-black">
                  <Item id="sns-t1-main" label="T1 Sympathetic Reset" bold />
                  <div className="mt-2 grid grid-cols-2 gap-4 pl-7 text-[10px] text-gray-700">
                    <p>1. Palpate bilateral anterior T1 to find restricted side.</p>
                    <p>2. Test contralateral Psoas (should be inhibited).</p>
                    <p>3. Move ipsilateral shoulder into external rotation.</p>
                    <p>4. Hold 45-90s until tenderness dissolves. Re-assess.</p>
                  </div>
                </div>

                <div className="p-4 border border-black">
                  <Item id="sns-diaphragm-main" label="Diaphragm Reset" bold />
                  <div className="mt-2 grid grid-cols-2 gap-4 pl-7 text-[10px] text-gray-700">
                    <p>1. Challenge tender points either side of sternum.</p>
                    <p>2. Palpate neck at C4 level (opposite to tender point).</p>
                    <p>3. Move ribcage superiorly towards neck. Hold 45-90s.</p>
                    <p>4. Release very slowly. Observe for deep sigh or yawn.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 4. Primitive Reflexes */}
        <Section title="IV. Primitive Reflexes (Foundational OS)">
          <div className="grid grid-cols-1 gap-2">
            {PRIMITIVE_REFLEXES.map(reflex => (
              <ReflexCard key={reflex.id} reflex={reflex} />
            ))}
          </div>
        </Section>

        {/* 5. Cranial Nerves */}
        <Section title="V. Cranial Nerves (Brainstem Pathways)">
          <div className="grid grid-cols-1 gap-2">
            {CRANIAL_NERVES.map(cn => (
              <NerveCard key={cn.id} nerve={cn} />
            ))}
          </div>
        </Section>

        {/* 6. Key Muscles */}
        <Section title="VI. Key Muscles (Clinical Indicators)">
          <div className="grid grid-cols-3 gap-x-8 gap-y-4">
            {Object.values(MUSCLE_INFO_DETAILS).filter(m => m.videoUrl).map(muscle => (
              <div key={muscle.name} className="flex items-center gap-2">
                <Checkbox id={`muscle-${muscle.name}`} onCheckedChange={() => toggleItem(`muscle-${muscle.name}`)} checked={!!checkedItems[`muscle-${muscle.name}`]} className="h-3 w-3 border-black rounded-none" />
                <div className="leading-tight">
                  <p className={cn("text-xs font-bold", checkedItems[`muscle-${muscle.name}`] && "line-through text-gray-400")}>{muscle.name}</p>
                  <p className="text-[9px] text-gray-500 italic">{muscle.meridian} Meridian</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer Notes */}
        <div className="mt-16 pt-8 border-t border-black">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Clinical Observations & Integration Notes</h3>
          <div className="space-y-8">
            <div className="border-b border-gray-200 w-full h-4" />
            <div className="border-b border-gray-200 w-full h-4" />
            <div className="border-b border-gray-200 w-full h-4" />
            <div className="border-b border-gray-200 w-full h-4" />
            <div className="border-b border-gray-200 w-full h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeNotes;