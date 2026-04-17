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
    if (window.confirm("Clear all checkboxes?")) {
      setCheckedItems({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-12 break-inside-avoid">
      <h2 className="text-lg font-serif font-bold border-b-2 border-black pb-1 mb-6 text-black uppercase tracking-tight">
        {title}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );

  const Item = ({ id, label, subtext, bold = false }: { id: string; label: string; subtext?: string; bold?: boolean }) => (
    <div className="flex items-start gap-4">
      <Checkbox 
        id={id} 
        checked={!!checkedItems[id]} 
        onCheckedChange={() => toggleItem(id)}
        className="mt-1 h-4 w-4 border-black rounded-none bg-white"
      />
      <div className="grid gap-1">
        <label
          htmlFor={id}
          className={cn(
            "text-sm cursor-pointer select-none font-serif",
            bold ? "font-bold underline" : "font-normal",
            checkedItems[id] && "line-through text-gray-400"
          )}
        >
          {label}
        </label>
        {subtext && (
          <p className={cn("text-xs text-gray-700 leading-relaxed font-serif italic", checkedItems[id] && "text-gray-300")}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );

  const ReflexCard = ({ reflex }: { reflex: any }) => {
    const imageUrl = customImages[reflex.id];
    return (
      <div className="p-6 border-2 border-black mb-8 break-inside-avoid bg-white">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <Checkbox 
              id={`reflex-${reflex.id}`} 
              checked={!!checkedItems[`reflex-${reflex.id}`]} 
              onCheckedChange={() => toggleItem(`reflex-${reflex.id}`)}
              className="h-5 w-5 border-black rounded-none"
            />
            <h3 className={cn("font-bold text-lg font-serif", checkedItems[`reflex-${reflex.id}`] && "line-through text-gray-400")}>
              {reflex.name}
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase border border-black px-2 py-0.5">{reflex.category}</span>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-3 text-xs font-serif">
            <p><strong>Stimulus:</strong> {reflex.stimulus}</p>
            <p><strong>Inhibition:</strong> {reflex.inhibitionPattern}</p>
            <p className="text-gray-800"><strong>Notes:</strong> ________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________</p>
          </div>
          
          {imageUrl && (
            <div className="w-32 h-24 border-2 border-black p-1 shrink-0 self-center">
              <img src={imageUrl} alt={reflex.name} className="w-full h-full object-cover grayscale contrast-150" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const NerveCard = ({ nerve }: { nerve: any }) => {
    const imageUrl = customImages[`cn${nerve.id}`];
    return (
      <div className="p-6 border-2 border-black mb-8 break-inside-avoid bg-white">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <Checkbox 
              id={`cn-${nerve.id}`} 
              checked={!!checkedItems[`cn-${nerve.id}`]} 
              onCheckedChange={() => toggleItem(`cn-${nerve.id}`)}
              className="h-5 w-5 border-black rounded-none"
            />
            <h3 className={cn("font-bold text-lg font-serif", checkedItems[`cn-${nerve.id}`] && "line-through text-gray-400")}>
              {nerve.name}: {nerve.latinName}
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase border border-black px-2 py-0.5">{nerve.nuclei} Nuclei</span>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-3 text-xs font-serif">
            <p><strong>Reflex Point:</strong> {nerve.reflexPoint}</p>
            <p><strong>Stimulus:</strong> {nerve.stimulus}</p>
            <p className="text-gray-800"><strong>Observations:</strong> ________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________</p>
          </div>
          
          {imageUrl && (
            <div className="w-32 h-24 border-2 border-black p-1 shrink-0 self-center">
              <img src={imageUrl} alt={nerve.name} className="w-full h-full object-cover grayscale contrast-150" />
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
        <p className="text-xs font-bold uppercase tracking-widest font-serif">Loading Worksheet...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 py-12 px-4 print:bg-white print:py-0 print:px-0">
      {/* Toolbar */}
      <div className="max-w-[1000px] mx-auto mb-8 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2 text-gray-700 font-serif italic">
          <span>Student Study Notes - Module 1</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={resetDocument} className="h-10 px-6 text-xs border-2 border-black bg-white hover:bg-gray-100 rounded-none font-bold">
            RESET FORM
          </Button>
          <Button variant="default" size="sm" onClick={handlePrint} className="h-10 px-8 text-xs font-bold bg-black text-white hover:bg-gray-900 rounded-none">
            PRINT WORKSHEET
          </Button>
        </div>
      </div>

      {/* Document Container */}
      <div className="max-w-[1000px] mx-auto bg-white border-4 border-black p-16 md:p-24 min-h-[1056px] print:border-none print:p-0 text-black font-serif">
        
        {/* Document Header */}
        <header className="mb-20">
          <div className="flex justify-between items-start border-b-4 border-black pb-6 mb-10">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">FNH STUDENT WORKSHEET</h1>
              <p className="text-sm font-bold mt-2">Module 1: Foundational Neurological Assessment</p>
            </div>
            <div className="text-right text-xs font-bold space-y-1">
              <p>STUDENT ID: ________________</p>
              <p>DATE: ____________________</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 text-sm font-bold">
            <p>CLIENT NAME: ________________________________________________________________</p>
            <p>PRIMARY GOAL: ________________________________________________________________</p>
          </div>
        </header>

        {/* 1. PEACE Process */}
        <Section title="1. THE PEACE PROCESS (CHECKLIST)">
          <div className="space-y-6">
            <Item id="p-step" label="P - Preliminary Assessment" subtext="Gather the story, run the baseline (BOLT/Coherence), and identify how the system is currently organised." bold />
            <Item id="e1-step" label="E - Ease the System" subtext="Create safety before change. Address SNS dominance (Harmonic Rocking, T1, Diaphragm). Ease must come before correction." bold />
            <Item id="a-step" label="A - Align the Hierarchy" subtext="Find the keystone — the true priority that the nervous system wants to address first (Reflexes, Nerves, Muscles)." bold />
            <Item id="c-step" label="C - Correct" subtext="Facilitate the primary change. Use Afferent (Bottom-Up) or Efferent (Top-Down) logic to reset the circuit." bold />
            <Item id="e2-step" label="E - Embed" subtext="Stabilise and integrate so change becomes lasting transformation. Prescribe specific neurological homework." bold />
          </div>
        </Section>

        {/* 2. Preliminary Vitals */}
        <Section title="2. PRELIMINARY VITALS & SNS STATUS">
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-4">
              <Item id="v-bolt" label="BOLT Score: ________ seconds" subtext="Target: 25s+ (Functional), 40s+ (Optimal)." />
              <Item id="v-coherence" label="Heart Coherence: ________ ratio" subtext="Check for autonomic synchronization." />
            </div>
            
            <div className="p-6 border-2 border-black space-y-6">
              <p className="text-xs font-bold uppercase">SNS Reset Procedures Performed:</p>
              <div className="grid grid-cols-2 gap-6">
                <Item id="sns-t1" label="T1 Sympathetic Reset" />
                <Item id="sns-diaphragm" label="Diaphragm Reset" />
                <Item id="sns-rocking" label="Harmonic Rocking" />
                <Item id="sns-vagus" label="Vagus Nerve Stim" />
              </div>
              <p className="text-xs mt-4">Notes on shift: ________________________________________________________________________________________________________________________________________________</p>
            </div>
          </div>
        </Section>

        {/* 3. Primitive Reflexes */}
        <Section title="3. PRIMITIVE REFLEX ASSESSMENT">
          <div className="grid grid-cols-1 gap-2">
            {PRIMITIVE_REFLEXES.map(reflex => (
              <ReflexCard key={reflex.id} reflex={reflex} />
            ))}
          </div>
        </Section>

        {/* 4. Cranial Nerves */}
        <Section title="4. CRANIAL NERVE PATHWAYS">
          <div className="grid grid-cols-1 gap-2">
            {CRANIAL_NERVES.map(cn => (
              <NerveCard key={cn.id} nerve={cn} />
            ))}
          </div>
        </Section>

        {/* 5. Muscle Indicators */}
        <Section title="5. KEY MUSCLE INDICATORS">
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            {Object.values(MUSCLE_INFO_DETAILS).filter(m => m.videoUrl).map(muscle => (
              <div key={muscle.name} className="flex items-center gap-3">
                <Checkbox id={`muscle-${muscle.name}`} onCheckedChange={() => toggleItem(`muscle-${muscle.name}`)} checked={!!checkedItems[`muscle-${muscle.name}`]} className="h-4 w-4 border-black rounded-none" />
                <div className="leading-tight">
                  <p className={cn("text-sm font-bold font-serif", checkedItems[`muscle-${muscle.name}`] && "line-through text-gray-400")}>{muscle.name}</p>
                  <p className="text-[10px] text-gray-600 italic">{muscle.meridian} Meridian</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer Notes */}
        <div className="mt-20 pt-10 border-t-4 border-black">
          <h3 className="text-sm font-bold uppercase mb-8">Integration & Homework Plan</h3>
          <div className="space-y-10">
            <div className="border-b-2 border-gray-300 w-full h-6" />
            <div className="border-b-2 border-gray-300 w-full h-6" />
            <div className="border-b-2 border-gray-300 w-full h-6" />
            <div className="border-b-2 border-gray-300 w-full h-6" />
            <div className="border-b-2 border-gray-300 w-full h-6" />
          </div>
        </div>

        <footer className="mt-24 text-center border-t-2 border-black pt-8">
          <p className="text-[10px] font-bold uppercase tracking-widest">Student Study Notes • For Educational Purposes Only • FNH Mastery Program</p>
        </footer>
      </div>
    </div>
  );
};

export default PracticeNotes;