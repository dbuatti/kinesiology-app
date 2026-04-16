"use client";

import React, { useState, useEffect } from "react";
import { MUSCLE_INFO_DETAILS } from "@/data/muscle-info-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Printer, RotateCcw, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "practice_notes_checked_items";

const PracticeNotes = () => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Load checked items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCheckedItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse checked items", e);
      }
    }
  }, []);

  // Save checked items to localStorage
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

  // Filter muscles that have video links (taught by Nick)
  const nickMuscles = Object.values(MUSCLE_INFO_DETAILS).filter(m => m.videoUrl);

  const Section = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
    <section className={cn("mb-8 break-inside-avoid", className)}>
      <h2 className="text-xl font-serif font-bold border-b border-slate-300 pb-1 mb-4 text-slate-900 uppercase tracking-tight">
        {title}
      </h2>
      <div className="space-y-3">
        {children}
      </div>
    </section>
  );

  const Item = ({ id, label, subtext, bold = false, indent = false }: { id: string; label: string; subtext?: string; bold?: boolean; indent?: boolean }) => (
    <div className={cn("flex items-start gap-3 group", indent && "ml-8")}>
      <Checkbox 
        id={id} 
        checked={!!checkedItems[id]} 
        onCheckedChange={() => toggleItem(id)}
        className="mt-1 border-slate-400 data-[state=checked]:bg-slate-700 data-[state=checked]:border-slate-700"
      />
      <div className="grid gap-0.5 leading-none">
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium leading-none cursor-pointer select-none",
            bold ? "font-bold text-slate-900" : "text-slate-700",
            checkedItems[id] && "line-through text-slate-400"
          )}
        >
          {label}
        </label>
        {subtext && (
          <p className={cn("text-xs text-slate-500 italic", checkedItems[id] && "text-slate-300")}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 print:bg-white print:py-0 print:px-0">
      {/* Stealth Toolbar */}
      <div className="max-w-[800px] mx-auto mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2 text-slate-400">
          <FileText size={18} />
          <span className="text-xs font-medium uppercase tracking-widest">Clinical Practice Document</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetDocument} className="h-8 text-xs gap-2 border-slate-200 hover:bg-slate-100">
            <RotateCcw size={14} /> Reset
          </Button>
          <Button variant="default" size="sm" onClick={handlePrint} className="h-8 text-xs gap-2 bg-slate-800 hover:bg-slate-900">
            <Printer size={14} /> Print Notes
          </Button>
        </div>
      </div>

      {/* Document Container */}
      <div className="max-w-[800px] mx-auto bg-white shadow-xl border border-slate-200 p-12 md:p-16 min-h-[1056px] print:shadow-none print:border-none print:p-0">
        
        {/* Document Header */}
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-serif font-black text-slate-900 mb-2">Clinical Practice Notes</h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em]">PEACE Process & Neurological Assessment</p>
          <div className="mt-6 flex justify-center gap-8 text-xs text-slate-400 border-y border-slate-100 py-3">
            <span>Date: ____________________</span>
            <span>Practitioner: ____________________</span>
            <span>Client ID: ____________________</span>
          </div>
        </header>

        {/* 1. PEACE Process */}
        <Section title="I. The PEACE Process">
          <Item id="p-step" label="P - Preliminary Assessment" subtext="Gather story, run baseline, identify current organisation." bold />
          <Item id="e1-step" label="E - Ease the System" subtext="Create safety. Ease must come before correction." bold />
          <Item id="a-step" label="A - Align the Hierarchy" subtext="Find the keystone priority." bold />
          <Item id="c-step" label="C - Correct" subtext="Facilitate primary change / reset." bold />
          <Item id="e2-step" label="E - Embed" subtext="Stabilise and integrate for lasting transformation." bold />
        </Section>

        {/* 2. Clinical Hierarchy */}
        <Section title="II. Clinical Hierarchy">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Asterisk Tier</h3>
              <Item id="h-emotional" label="Emotional Charge" />
              <Item id="h-assemblage" label="Assemblage Point" />
              <Item id="h-hara" label="Hara Line" />
              <Item id="h-heartwall" label="Heart Wall" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">1° Primary Tier</h3>
              <Item id="h-primitive" label="Primitive Reflexes" />
              <Item id="h-nociception" label="Nociception" />
              <Item id="h-cranial" label="Cranial Nerves" />
              <Item id="h-eyes" label="Eye Systems" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">2° Secondary Tier</h3>
              <Item id="h-immune" label="Immune Vials (TH1/2/17/9)" />
              <Item id="h-infections" label="Infections" />
              <Item id="h-krebs" label="Krebs Cycle" />
              <Item id="h-organ" label="Organ/Gland Balance" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">3° Tertiary Tier</h3>
              <Item id="h-icv" label="Ileocecal Valve (ICV)" />
              <Item id="h-cranialbones" label="Cranial Bones" />
              <Item id="h-musculo" label="Musculoskeletal" />
            </div>
          </div>
        </Section>

        {/* 3. Preliminary & SNS Resets */}
        <Section title="III. Preliminary & SNS Resets">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Preliminary Vitals</h3>
                <Item id="v-bolt" label="BOLT Score" subtext="Measure CO2 tolerance. Target: 25s+ (Functional), 40s+ (Optimal)." />
                <Item id="v-coherence" label="Heart Coherence" subtext="Autonomic sync. HR/BR ratio. Check for coherence vs discordance." />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">SNS Down-Regulation Procedures</h3>
              
              <div className="space-y-2">
                <Item id="sns-t1-main" label="T1 Sympathetic Reset" bold />
                <Item id="sns-t1-s1" label="1. Palpate bilateral anterior first rib (T1) to find restricted/tender side." indent />
                <Item id="sns-t1-s2" label="2. Test contralateral Psoas muscle (should be inhibited)." indent />
                <Item id="sns-t1-s3" label="3. Monitor tender spot; move ipsilateral shoulder into external rotation." indent />
                <Item id="sns-t1-s4" label="4. Hold for 45-90s until tenderness dissolves." indent />
                <Item id="sns-t1-s5" label="5. Re-assess tenderness and Psoas." indent />
              </div>

              <div className="space-y-2">
                <Item id="sns-diaphragm-main" label="Diaphragm Reset" bold />
                <Item id="sns-diaphragm-s1" label="1. Challenge tender points either side of sternum (Phrenic nerve)." indent />
                <Item id="sns-diaphragm-s2" label="2. Palpate neck at C4 level (usually opposite to sternum tender point)." indent />
                <Item id="sns-diaphragm-s3" label="3. Move ribcage superiorly towards neck." indent />
                <Item id="sns-diaphragm-s4" label="4. Hold for 45-90s. Release very slowly." indent />
              </div>

              <div className="space-y-2">
                <Item id="sns-vagus-main" label="Vagus Nerve Procedure" bold />
                <Item id="sns-vagus-stim" label="Stimulation: Target branch (Auricular/Cervical/Abdominal) for 60s." indent />
                <Item id="sns-vagus-sr1" label="Screen & Reset: Challenge Vagal reflex point (Occiput/Auricular) + IM." indent />
                <Item id="sns-vagus-sr2" label="Identify dysfunctional function (Humming, Swallowing, etc.)." indent />
                <Item id="sns-vagus-sr3" label="Challenge Organ/Gland reflex + Polarity." indent />
                <Item id="sns-vagus-sr4" label="Correction: Hold Vagal Reflex + Stim Function + Hold Organ/Gland Reflex + Medulla Breathing (15-30s)." indent />
              </div>
            </div>
          </div>
        </Section>

        {/* 4. Lymphatic Assessment */}
        <Section title="IV. Lymphatic Assessment">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Cervical', 'Thoracic L', 'Thoracic R', 'Cisterna Chyli', 'Inguinal', 'Popliteal', 'Maxillary', 'Axillary'].map(zone => (
              <Item key={zone} id={`lymph-${zone.toLowerCase().replace(' ', '-')}`} label={zone} />
            ))}
          </div>
        </Section>

        {/* 5. Primitive Reflexes */}
        <Section title="V. Primitive Reflexes">
          <div className="space-y-4">
            {PRIMITIVE_REFLEXES.map(reflex => (
              <Item 
                key={reflex.id} 
                id={`reflex-${reflex.id}`} 
                label={reflex.name} 
                subtext={`Stim: ${reflex.stimulus} | Pattern: ${reflex.inhibitionPattern}`}
              />
            ))}
          </div>
        </Section>

        {/* 6. Cranial Nerves */}
        <Section title="VI. Cranial Nerves">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {CRANIAL_NERVES.map(cn => (
              <Item 
                key={cn.id} 
                id={`cn-${cn.id}`} 
                label={`${cn.name} (${cn.latinName})`} 
                subtext={cn.stimulus}
              />
            ))}
          </div>
        </Section>

        {/* 7. Key Muscles */}
        <Section title="VII. Key Muscles (Clinical Indicators)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {nickMuscles.map(muscle => (
              <Item 
                key={muscle.name} 
                id={`muscle-${muscle.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`} 
                label={muscle.name} 
                subtext={muscle.meridian ? `Meridian: ${muscle.meridian}` : undefined}
              />
            ))}
          </div>
        </Section>

        {/* Footer Notes */}
        <div className="mt-12 pt-8 border-t border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Clinical Observations & Notes</h3>
          <div className="space-y-6">
            <div className="h-px bg-slate-100 w-full" />
            <div className="h-px bg-slate-100 w-full" />
            <div className="h-px bg-slate-100 w-full" />
            <div className="h-px bg-slate-100 w-full" />
            <div className="h-px bg-slate-100 w-full" />
          </div>
        </div>

        <footer className="mt-16 text-center text-[10px] text-slate-300 uppercase tracking-[0.3em]">
          Confidential Clinical Document • For Professional Use Only
        </footer>
      </div>
    </div>
  );
};

export default PracticeNotes;