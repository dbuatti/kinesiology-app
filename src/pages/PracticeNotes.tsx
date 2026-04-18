"use client";

import React, { useState, useEffect } from "react";
import { MUSCLE_INFO_DETAILS } from "@/data/muscle-info-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";
import { EYE_POSITIONS } from "@/data/emotion-data";
import { HAND_REFLEXOLOGY } from "@/data/vagus-data";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Printer, Eye, Hand, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// Docs Components
import DocsHeader from "@/components/docs/DocsHeader";
import DocsToolbar from "@/components/docs/DocsToolbar";
import DocsRuler from "@/components/docs/DocsRuler";

const CHECKED_STORAGE_KEY = "practice_notes_checked_items";
const TEXT_STORAGE_KEY = "practice_notes_text_data";

const PracticeNotes = () => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [textData, setTextData] = useState<Record<string, string>>({});
  const [customImages, setCustomImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedChecked = localStorage.getItem(CHECKED_STORAGE_KEY);
    const savedText = localStorage.getItem(TEXT_STORAGE_KEY);
    
    if (savedChecked) {
      try { setCheckedItems(JSON.parse(savedChecked)); } catch (e) { console.error(e); }
    }
    if (savedText) {
      try { setTextData(JSON.parse(savedText)); } catch (e) { console.error(e); }
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
    localStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(checkedItems));
  }, [checkedItems]);

  useEffect(() => {
    localStorage.setItem(TEXT_STORAGE_KEY, JSON.stringify(textData));
  }, [textData]);

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTextChange = (id: string, value: string) => {
    setTextData((prev) => ({ ...prev, [id]: value }));
  };

  const resetDocument = () => {
    if (window.confirm("Are you sure you want to clear all notes and checkboxes?")) {
      setCheckedItems({});
      setTextData({});
      localStorage.removeItem(CHECKED_STORAGE_KEY);
      localStorage.removeItem(TEXT_STORAGE_KEY);
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

  const Item = ({ id, label, subtext, bold = false, hasInput = false }: { id: string; label: string; subtext?: string; bold?: boolean; hasInput?: boolean }) => (
    <div className="flex items-start gap-3">
      <Checkbox 
        id={id} 
        checked={!!checkedItems[id]} 
        onCheckedChange={() => toggleItem(id)}
        className="mt-1 h-4 w-4 border-black rounded-none"
      />
      <div className="grid gap-0.5 flex-1">
        <div className="flex items-center gap-2">
          <label
            htmlFor={id}
            className={cn(
              "text-sm cursor-pointer select-none shrink-0",
              bold ? "font-bold" : "font-normal",
              checkedItems[id] && "line-through text-gray-400"
            )}
          >
            {label}
          </label>
          {hasInput && (
            <input 
              type="text"
              value={textData[id] || ""}
              onChange={(e) => handleTextChange(id, e.target.value)}
              className="flex-1 border-b border-black bg-transparent outline-none text-sm px-1 min-w-[60px] focus:border-blue-500 transition-colors"
              placeholder="..."
            />
          )}
        </div>
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
    const id = `reflex-${reflex.id}`;
    return (
      <div className="p-4 border border-black mb-4 break-inside-avoid">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3 flex-1">
            <Checkbox 
              id={id} 
              checked={!!checkedItems[id]} 
              onCheckedChange={() => toggleItem(id)}
              className="h-4 w-4 border-black rounded-none"
            />
            <h3 className={cn("font-bold text-base shrink-0", checkedItems[id] && "line-through text-gray-400")}>
              {reflex.name}
            </h3>
            <input 
              type="text"
              value={textData[`${id}-note`] || ""}
              onChange={(e) => handleTextChange(`${id}-note`, e.target.value)}
              className="flex-1 border-b border-black/20 bg-transparent outline-none text-xs px-2 focus:border-blue-500 transition-colors"
              placeholder="Add assessment note..."
            />
          </div>
        </div>
        
        <div className="flex gap-6">
          <div className="flex-1 space-y-2 text-xs">
            <p><strong>Stimulus:</strong> {reflex.stimulus}</p>
            <p><strong>Inhibition Pattern:</strong> {reflex.inhibitionPattern}</p>
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
    const id = `cn-${nerve.id}`;
    return (
      <div className="p-4 border border-black mb-4 break-inside-avoid">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3 flex-1">
            <Checkbox 
              id={id} 
              checked={!!checkedItems[id]} 
              onCheckedChange={() => toggleItem(id)}
              className="h-4 w-4 border-black rounded-none"
            />
            <h3 className={cn("font-bold text-base shrink-0", checkedItems[id] && "line-through text-gray-400")}>
              {nerve.name}: {nerve.latinName}
            </h3>
            <input 
              type="text"
              value={textData[`${id}-note`] || ""}
              onChange={(e) => handleTextChange(`${id}-note`, e.target.value)}
              className="flex-1 border-b border-black/20 bg-transparent outline-none text-xs px-2 focus:border-blue-500 transition-colors"
              placeholder="Add nerve note..."
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 text-xs">
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

  const BrainZoneCard = ({ point }: { point: any }) => {
    const imageUrl = customImages[point.id];
    const id = `brain-${point.id}`;
    return (
      <div className="p-4 border border-black mb-4 break-inside-avoid">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3 flex-1">
            <Checkbox 
              id={id} 
              checked={!!checkedItems[id]} 
              onCheckedChange={() => toggleItem(id)}
              className="h-4 w-4 border-black rounded-none"
            />
            <h3 className={cn("font-bold text-base shrink-0", checkedItems[id] && "line-through text-gray-400")}>
              {point.name}
            </h3>
            <input 
              type="text"
              value={textData[`${id}-note`] || ""}
              onChange={(e) => handleTextChange(`${id}-note`, e.target.value)}
              className="flex-1 border-b border-black/20 bg-transparent outline-none text-xs px-2 focus:border-blue-500 transition-colors"
              placeholder="Add zone note..."
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 text-xs">
            <p><strong>Location:</strong> {point.location}</p>
            <p><strong>Stimulus:</strong> {point.stimulus || point.technique || "Standard challenge."}</p>
          </div>
          
          {imageUrl && (
            <div className="w-32 h-24 border border-gray-300 p-0.5 shrink-0">
              <img src={imageUrl} alt={point.name} className="w-full h-full object-cover grayscale contrast-125" />
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
    <div className="min-h-screen bg-[#F9FBFD] flex flex-col">
      <DocsHeader />
      <DocsToolbar />
      <DocsRuler />

      <div className="flex-1 overflow-auto p-8 md:p-12 flex justify-center print:p-0 print:bg-white">
        {/* Document Container */}
        <div className="w-full max-w-[816px] bg-white border border-slate-200 shadow-sm p-16 md:p-20 min-h-[1056px] print:border-none print:p-0 text-black font-sans relative">
          
          {/* Document Header */}
          <header className="mb-16 text-center">
            <h1 className="text-4xl font-serif font-bold mb-2 tracking-tight">Clinical Practice Notes</h1>
            <div className="mt-10 grid grid-cols-3 gap-8 text-xs font-bold border-y border-black py-6">
              <div className="flex items-center gap-2">
                <span>Date:</span>
                <input 
                  type="text" 
                  value={textData.header_date || ""} 
                  onChange={(e) => handleTextChange('header_date', e.target.value)}
                  className="flex-1 border-b border-black bg-transparent outline-none px-1 focus:border-blue-500 transition-colors"
                  placeholder="________________"
                />
              </div>
              <div className="flex items-center gap-2">
                <span>Practitioner:</span>
                <input 
                  type="text" 
                  value={textData.header_practitioner || ""} 
                  onChange={(e) => handleTextChange('header_practitioner', e.target.value)}
                  className="flex-1 border-b border-black bg-transparent outline-none px-1 focus:border-blue-500 transition-colors"
                  placeholder="________________"
                />
              </div>
              <div className="flex items-center gap-2">
                <span>Client ID:</span>
                <input 
                  type="text" 
                  value={textData.header_clientid || ""} 
                  onChange={(e) => handleTextChange('header_clientid', e.target.value)}
                  className="flex-1 border-b border-black bg-transparent outline-none px-1 focus:border-blue-500 transition-colors"
                  placeholder="________________"
                />
              </div>
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
                  <Item id="v-bolt" label="BOLT Score" subtext="Measure CO2 tolerance. Target: 25s+ (Functional), 40s+ (Optimal)." hasInput />
                  <Item id="v-coherence" label="Heart Coherence" subtext="Autonomic sync. HR/BR ratio. Check for coherence vs discordance." hasInput />
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

                  <div className="p-4 border border-black">
                    <div className="flex items-center justify-between mb-2">
                      <Item id="sns-vagus-main" label="Vagus Nerve Process" bold />
                      <input 
                        type="text"
                        value={textData['sns-vagus-note'] || ""}
                        onChange={(e) => handleTextChange('sns-vagus-note', e.target.value)}
                        className="flex-1 border-b border-black/20 bg-transparent outline-none text-xs px-2 ml-4 focus:border-blue-500 transition-colors"
                        placeholder="Add vagus note..."
                      />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-6 pl-7 text-[10px] text-gray-700">
                      <div className="space-y-2">
                        <p className="font-bold uppercase text-[8px] text-indigo-600">1. Stimulation Protocol</p>
                        <p>• Select Branch: Auricular, Cervical, or Abdominal.</p>
                        <p>• Apply gentle stimulation for 60s.</p>
                        <p>• Monitor for Shift: Sigh, yawn, gurgle, salivation.</p>
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold uppercase text-[8px] text-rose-600">2. Screen & Reset Protocol</p>
                        <p>• Functional Check: Test Humming/Swallowing vs IM.</p>
                        <p>• Challenge: Identify Organ/Gland + Polarity + Spinal Match.</p>
                        <p>• Correction: Medulla Breathing (Blocked Inhale/Forced Exhale) 30s.</p>
                        <p>• Verify: Re-test function and IM.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-black">
                    <div className="flex items-center justify-between mb-2">
                      <Item id="sns-lymphatic-main" label="Lymphatic System Assessment" bold />
                      <input 
                        type="text"
                        value={textData['sns-lymphatic-note'] || ""}
                        onChange={(e) => handleTextChange('sns-lymphatic-note', e.target.value)}
                        className="flex-1 border-b border-black/20 bg-transparent outline-none text-xs px-2 ml-4 focus:border-blue-500 transition-colors"
                        placeholder="Add lymphatic findings..."
                      />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-6 pl-7 text-[10px] text-gray-700">
                      <div className="space-y-1">
                        <p className="font-bold uppercase text-[8px] text-blue-600">Diagnosis</p>
                        <p>• Palpate Suture (Glide/Tenderness).</p>
                        <p>• Work neck down to find priority node.</p>
                        <p>• Confirm with K27 Priority Check.</p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold uppercase text-[8px] text-emerald-600">Correction</p>
                        <p>• Move tissue into 'Position of Ease'.</p>
                        <p>• Hold for 45-90s (Counterstrain).</p>
                        <p>• Re-test suture glide & tenderness.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* 4. Neuro-Emotional Integration */}
          <Section title="IV. Neuro-Emotional Integration">
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Hand size={14} className="text-indigo-600" /> Organ Pulse Points
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase text-slate-400">Left Wrist</p>
                      <div className="text-[10px] space-y-1">
                        <p><strong>Distal:</strong> SI (L) / HT (D)</p>
                        <p><strong>Middle:</strong> GB (L) / LV (D)</p>
                        <p><strong>Proximal:</strong> BL (L) / KI (D)</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase text-slate-400">Right Wrist</p>
                      <div className="text-[10px] space-y-1">
                        <p><strong>Distal:</strong> LI (L) / LU (D)</p>
                        <p><strong>Middle:</strong> ST (L) / SP (D)</p>
                        <p><strong>Proximal:</strong> TW (L) / PC (D)</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[8px] text-gray-500 italic mt-2">(L) = Light/Superficial, (D) = Deep</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Eye size={14} className="text-rose-600" /> Eye Accessing Cues (NLP)
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                    <p><strong>Up Left:</strong> Visual Memory</p>
                    <p><strong>Up Right:</strong> Visual Constructed</p>
                    <p><strong>Mid Left:</strong> Auditory Memory</p>
                    <p><strong>Mid Right:</strong> Auditory Constructed</p>
                    <p><strong>Down Left:</strong> Internal Monologue</p>
                    <p><strong>Down Right:</strong> Kinesthetic / Felt Sense</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-black">
                <Item id="nei-protocol" label="Integration Protocol" bold />
                <div className="mt-2 text-[10px] text-gray-700 leading-relaxed">
                  <p>1. Identify Timeline (Age/Month) and Primary Emotion.</p>
                  <p>2. Locate surrogate Organ Pulse Point and Energy Polarity.</p>
                  <p>3. Hold ESR + Pulse Point + Eye Position while client replays stress.</p>
                  <p>4. Monitor for Shift (Sigh/Yawn). Finish with Positive Upload.</p>
                </div>
              </div>
            </div>
          </Section>

          {/* 5. Primitive Reflexes */}
          <Section title="V. Primitive Reflexes (Foundational OS)">
            <div className="grid grid-cols-1 gap-2">
              {PRIMITIVE_REFLEXES.map(reflex => (
                <ReflexCard key={reflex.id} reflex={reflex} />
              ))}
            </div>
          </Section>

          {/* 6. Cranial Nerves */}
          <Section title="VI. Cranial Nerves (Brainstem Pathways)">
            <div className="grid grid-cols-1 gap-2">
              {CRANIAL_NERVES.map(cn => (
                <NerveCard key={cn.id} nerve={cn} />
              ))}
            </div>
          </Section>

          {/* 7. Brain Zones */}
          <Section title="VII. Brain Zones (Cortical & Subcortical)">
            <div className="grid grid-cols-1 gap-2">
              {BRAIN_REFLEX_POINTS.filter(p => p.category !== 'Cranial Nerve').map(point => (
                <BrainZoneCard key={point.id} point={point} />
              ))}
            </div>
          </Section>

          {/* 8. Key Muscles */}
          <Section title="VIII. Key Muscles (Clinical Indicators)">
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
            <div className="relative">
              <textarea 
                value={textData.observations || ""}
                onChange={(e) => handleTextChange('observations', e.target.value)}
                className="w-full min-h-[300px] bg-transparent border-none outline-none resize-none text-sm leading-[32px] font-medium"
                style={{
                  backgroundImage: 'linear-gradient(to bottom, transparent 31px, #e5e7eb 31px)',
                  backgroundSize: '100% 32px',
                  backgroundAttachment: 'local'
                }}
                placeholder="Type your clinical observations here..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons for Docs feel */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-3 print:hidden">
        <Button variant="outline" size="icon" onClick={resetDocument} className="h-12 w-12 rounded-full shadow-xl bg-white border-slate-200 text-slate-500 hover:text-rose-600">
          <RotateCcw size={20} />
        </Button>
        <Button onClick={handlePrint} className="h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 text-white">
          <Printer size={24} />
        </Button>
      </div>
    </div>
  );
};

export default PracticeNotes;