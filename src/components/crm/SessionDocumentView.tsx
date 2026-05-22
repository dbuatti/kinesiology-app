"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Check,
  FileText,
  Printer,
  ArrowLeft,
  Save,
  Loader2,
  Clock,
  ChevronRight,
  AlertCircle,
  ExternalLink,
  Zap,
  Activity,
  Brain,
  Heart,
  Shield,
  List,
  Compass,
  ShieldCheck,
  Target,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { AppointmentWithClient } from '@/types/crm';
import { safeParse } from '@/utils/safe-json';
import { PRIMITIVE_REFLEXES } from '@/data/primitive-reflex-data';
import { CRANIAL_NERVES } from '@/data/cranial-nerve-data';
import { MUSCLE_GROUPS, MIDLINE_MUSCLES } from '@/data/muscle-data';
import { BRAIN_REFLEX_POINTS } from '@/data/brain-reflex-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SessionDocumentViewProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
  onClose: () => void;
}

const OUTLINE_ITEMS = [
  { id: "p-sec", label: "P — Preliminary", icon: Compass },
  { id: "e-sec", label: "E — Ease System", icon: ShieldCheck },
  { id: "a-sec", label: "A — Align Hierarchy", icon: List },
  { id: "c-sec", label: "C — Correct (Wizard)", icon: Zap },
  { id: "e2-sec", label: "E — Embed (Homework)", icon: ClipboardCheck },
];

const CORRECTIONS_GUIDE = [
  {
    title: "T1 Sympathetic Reset",
    icon: Zap,
    color: "text-amber-600 bg-amber-50",
    steps: [
      "Palpate bilateral anterior first rib (T1) to find restricted/tender side.",
      "Test contralateral Psoas muscle (should be inhibited).",
      "Move ipsilateral shoulder into external rotation.",
      "Hold 45-90s until tenderness dissolves. Re-assess Psoas."
    ]
  },
  {
    title: "Diaphragm Reset",
    icon: Activity,
    color: "text-blue-600 bg-blue-50",
    steps: [
      "Challenge tender points either side of sternum.",
      "Palpate neck at C4 level (usually opposite to tender point).",
      "Move ribcage superiorly towards neck. Hold 45-90s.",
      "Release very slowly. Observe for deep sigh or yawn."
    ]
  },
  {
    title: "Vagus Nerve Process",
    icon: Brain,
    color: "text-purple-600 bg-purple-50",
    steps: [
      "Hold Occiput-Atlas or Auricular reflex point.",
      "Challenge Organ/Gland + Polarity + Spinal Match.",
      "Apply Medulla Breathing (Blocked Inhale/Forced Exhale) for 30s.",
      "Re-test vagal function and indicator muscle."
    ]
  },
  {
    title: "Harmonic Rocking",
    icon: Heart,
    color: "text-rose-600 bg-rose-50",
    steps: [
      "Place one hand on belly button, other on Kidney 27 points.",
      "Rock gently for 3 minutes to down-regulate the SNS.",
      "Observe for parasympathetic shift (sigh, yawn, gurgle)."
    ]
  }
];

const SessionDocumentView = ({ 
  appointment, 
  onUpdate, 
  saveField, 
  updatePriorityPattern,
  onClose
}: SessionDocumentViewProps) => {
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [openGuides, setOpenGuides] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<string>("p-sec");
  const pattern = useMemo(() => safeParse(appointment.priority_pattern, {} as any), [appointment.priority_pattern]);

  const metadata = useMemo(() => {
    if (!appointment.metadata) return {};
    if (typeof appointment.metadata === 'string') {
      return safeParse(appointment.metadata, {});
    }
    return appointment.metadata;
  }, [appointment.metadata]);

  const updateMetadataField = async (key: string, value: any) => {
    const newMetadata = { ...metadata, [key]: value };
    await saveField('metadata', newMetadata);
    setLastSaved(new Date());
    onUpdate();
  };

  // Set up IntersectionObserver to track active section on scroll
  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    
    const observerOptions = {
      root: scrollContainer,
      rootMargin: '-15% 0px -65% 0px', // Triggers when section header is in the upper-middle viewport
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    const targets = OUTLINE_ITEMS.map(item => document.getElementById(item.id));
    targets.forEach(target => {
      if (target) observer.observe(target);
    });

    return () => {
      targets.forEach(target => {
        if (target) observer.unobserve(target);
      });
    };
  }, []);

  const SectionHeader = ({ id, title, subtitle }: { id: string, title: string, subtitle?: string }) => (
    <div id={id} className="border-b-2 border-black pb-1 mb-6 mt-16 first:mt-0 scroll-mt-24">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{title}</h2>
      {subtitle && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{subtitle}</p>}
    </div>
  );

  const SubHeader = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 mt-10 border-l-4 border-slate-200 pl-3">{children}</h3>
  );

  const DocInput = ({ label, value, field, placeholder, multiline = false, type = "text" }: any) => (
    <div className="space-y-1.5 group">
      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-black transition-colors">{label}</label>
      {multiline ? (
        <textarea
          value={value || ""}
          onChange={(e) => {
            saveField(field, e.target.value);
            setLastSaved(new Date());
          }}
          placeholder={placeholder}
          className="w-full min-h-[100px] bg-slate-50/30 border border-slate-200 rounded-none p-4 text-sm font-medium focus:border-black focus:bg-white focus:ring-0 transition-all resize-none"
        />
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => {
            saveField(field, e.target.value);
            setLastSaved(new Date());
          }}
          placeholder={placeholder}
          className="w-full bg-transparent border-b border-slate-200 py-2 text-sm font-bold focus:border-black outline-none transition-all placeholder:text-slate-200"
        />
      )}
    </div>
  );

  const CheckItem = ({ category, name, side }: { category: string, name: string, side?: 'L' | 'R' }) => {
    const fullName = side ? `${name} (${side})` : name;
    const isChecked = pattern[category]?.[fullName] === 'Inhibited';

    return (
      <div 
        className={cn(
          "flex items-center gap-2 p-1.5 transition-all cursor-pointer group border border-transparent",
          isChecked ? "bg-slate-900 text-white" : "hover:bg-slate-50"
        )}
        onClick={() => {
          updatePriorityPattern(category, name, isChecked ? 'Clear' : 'Inhibited', side);
          setLastSaved(new Date());
        }}
      >
        <div className={cn(
          "w-3.5 h-3.5 border flex items-center justify-center transition-all shrink-0",
          isChecked ? "bg-white border-white text-black" : "border-slate-300 group-hover:border-black"
        )}>
          {isChecked && <Check size={10} strokeWidth={4} />}
        </div>
        <span className={cn(
          "text-[10px] font-bold truncate",
          isChecked ? "text-white" : "text-slate-600"
        )}>
          {side ? `${side}: ${name}` : name}
        </span>
      </div>
    );
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    const scrollContainer = document.getElementById('main-scroll-container');
    if (el && scrollContainer) {
      const yOffset = -100; // Offset to account for sticky header
      const y = el.getBoundingClientRect().top + scrollContainer.scrollTop + yOffset;
      scrollContainer.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const toggleGuide = (title: string) => {
    setOpenGuides(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // Get sorted list of brain zone names for the dropdowns
  const brainZoneOptions = useMemo(() => {
    return BRAIN_REFLEX_POINTS.map(p => {
      const displayName = p.name.includes(':') ? p.name.split(':')[0].trim() : p.name;
      return { id: p.id, name: displayName };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  return (
    <div className="bg-white min-h-screen text-black font-sans pb-40 print:p-0 print:m-0">
      {/* Document Controls */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-black px-6 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-none h-9 px-4 font-black text-[10px] uppercase tracking-widest border border-black hover:bg-black hover:text-white transition-all">
            <ArrowLeft size={14} className="mr-2" /> Exit
          </Button>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Record</span>
            <span className="text-sm font-black">{appointment.clients.name}</span>
          </div>
          <Badge variant="outline" className="rounded-none border-black font-black text-[8px] uppercase px-2 py-0.5">
            {appointment.status}
          </Badge>
        </div>

        <div className="hidden lg:flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
          <button onClick={() => scrollTo('p-sec')} className="hover:text-black transition-colors">P</button>
          <span className="opacity-20">/</span>
          <button onClick={() => scrollTo('e-sec')} className="hover:text-black transition-colors">E</button>
          <span className="opacity-20">/</span>
          <button onClick={() => scrollTo('a-sec')} className="hover:text-black transition-colors">A</button>
          <span className="opacity-20">/</span>
          <button onClick={() => scrollTo('c-sec')} className="hover:text-black transition-colors">C</button>
          <span className="opacity-20">/</span>
          <button onClick={() => scrollTo('e2-sec')} className="hover:text-black transition-colors">E</button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Last Sync</p>
            <p className="text-[10px] font-bold tabular-nums">{format(lastSaved, "HH:mm:ss")}</p>
          </div>
          {appointment.notion_link && (
            <Button asChild variant="outline" size="sm" className="rounded-none border-black font-black text-[10px] uppercase tracking-widest h-9 px-4 hover:bg-slate-50">
              <a href={appointment.notion_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} className="mr-2" /> Notion
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-none border-black font-black text-[10px] uppercase tracking-widest h-9 px-4 hover:bg-slate-50">
            <Printer size={14} className="mr-2" /> Print
          </Button>
        </div>
      </div>

      {/* Split Layout: Sidebar + Document */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex gap-12 items-start justify-center pt-8 print:block print:p-0">
        
        {/* Left Sidebar: Outline & Corrections Guide */}
        <aside className="w-80 shrink-0 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto p-6 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-8 print:hidden custom-scrollbar">
          {/* Document Outline */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Document Outline</p>
            <div className="space-y-1">
              {OUTLINE_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-xl transition-all text-left border-l-2",
                      isActive 
                        ? "bg-indigo-50 border-indigo-600 text-indigo-600 font-black" 
                        : "border-transparent text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/30"
                    )}
                  >
                    <item.icon size={14} className={isActive ? "text-indigo-600" : "text-slate-400"} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          {/* Corrections Guide */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Corrections Guide</p>
            <div className="space-y-3">
              {CORRECTIONS_GUIDE.map((guide) => {
                const isOpen = !!openGuides[guide.title];
                return (
                  <Collapsible key={guide.title} open={isOpen} onOpenChange={() => toggleGuide(guide.title)}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-all text-left">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", guide.color)}>
                            <guide.icon size={14} />
                          </div>
                          <span className="text-xs font-bold text-slate-800 truncate">{guide.title}</span>
                        </div>
                        {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2 pl-2 pr-1 animate-in slide-in-from-top-1 duration-200">
                      <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-2">
                        {guide.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-2 items-start text-[10px] leading-relaxed text-slate-600">
                            <span className="font-black text-indigo-600 shrink-0">{idx + 1}.</span>
                            <p className="font-medium">{step}</p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Side: The Document */}
        <div className="flex-1 max-w-[850px] bg-white border-none md:border md:border-slate-200 md:shadow-sm p-6 sm:p-10 md:p-16 min-h-[1056px] print:border-none print:p-0">
          {/* Header */}
          <div className="flex justify-between items-end border-b-4 border-black pb-10">
            <div className="space-y-1">
              <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Session Log</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em]">Resonance Clinical Infrastructure • v2.4</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xl font-black">{appointment.clients.name}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{format(appointment.date, "EEEE, MMMM d, yyyy")}</p>
              <p className="text-[9px] font-mono text-slate-300 uppercase">{appointment.display_id || appointment.id}</p>
            </div>
          </div>

          {/* P - PRELIMINARY */}
          <section>
            <SectionHeader id="p-sec" title="P — Preliminary Assessment" subtitle="Intake & Baseline Vitals" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-10">
                <DocInput label="Session Goal" value={appointment.goal} field="goal" placeholder="Primary objective..." />
                <DocInput label="Main Concern" value={appointment.issue} field="issue" placeholder="Presenting symptoms..." />
                
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">BOLT Score</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        value={appointment.bolt_score || ""} 
                        onChange={(e) => saveField('bolt_score', e.target.value)}
                        className="w-20 bg-transparent border-b-2 border-slate-100 py-1 text-3xl font-black outline-none focus:border-black transition-colors"
                      />
                      <span className="text-[10px] font-black uppercase text-slate-300">Sec</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Coherence</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        step="0.1"
                        value={appointment.coherence_score || ""} 
                        onChange={(e) => saveField('coherence_score', e.target.value)}
                        className="w-20 bg-transparent border-b-2 border-slate-100 py-1 text-3xl font-black outline-none focus:border-black transition-colors"
                      />
                      <span className="text-[10px] font-black uppercase text-slate-300">Ratio</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-black uppercase tracking-widest">Hydration Check</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Systemic Conductivity</p>
                  </div>
                  <Checkbox 
                    checked={appointment.hydrated || false} 
                    onCheckedChange={(checked) => saveField('hydrated', !!checked)}
                    className="h-8 w-8 border-black rounded-none data-[state=checked]:bg-black"
                  />
                </div>
                <DocInput label="ROM / Cogs Notes" value={appointment.sagittal_plane_notes} field="sagittal_plane_notes" placeholder="Sagittal, Frontal, Transverse findings..." multiline />
              </div>
            </div>

            <SubHeader>Global Neurological Assessments</SubHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
              <DocInput label="Fakuda Step Test" value={appointment.fakuda_notes} field="fakuda_notes" placeholder="Rotation, drift, or instability..." multiline />
              <DocInput label="Sharpened Rhombergs" value={appointment.sharpened_rhombergs_notes} field="sharpened_rhombergs_notes" placeholder="Sway pattern, time held..." multiline />
              <DocInput label="Frontal Lobe" value={appointment.frontal_lobe_notes} field="frontal_lobe_notes" placeholder="Hand drill speed/coordination..." multiline />
              <DocInput label="Righting Reflexes" value={appointment.righting_reflex_notes} field="righting_reflex_notes" placeholder="Ocular vs Labyrinthine..." multiline />
            </div>
          </section>

          {/* E - EASE */}
          <section>
            <SectionHeader id="e-sec" title="E — Ease the System" subtitle="SNS Down-Regulation" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="p-6 border border-black space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-widest">Harmonic Rocking</h4>
                    <Checkbox className="border-black rounded-none data-[state=checked]:bg-black" />
                  </div>
                  <DocInput label="Notes" value={appointment.harmonic_rocking_notes} field="harmonic_rocking_notes" placeholder="Client response..." />
                </div>
                <div className="p-6 border border-black space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-widest">T1 Sympathetic Reset</h4>
                    <Checkbox className="border-black rounded-none data-[state=checked]:bg-black" />
                  </div>
                  <DocInput label="Notes" value={appointment.t1_reset_notes} field="t1_reset_notes" placeholder="Side, Psoas response..." />
                </div>
              </div>
              <div className="space-y-6">
                <div className="p-6 border border-black space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-widest">Diaphragm Reset</h4>
                    <Checkbox className="border-black rounded-none data-[state=checked]:bg-black" />
                  </div>
                  <DocInput label="Notes" value={appointment.diaphragm_reset_notes} field="diaphragm_reset_notes" placeholder="Tender points, breath shift..." />
                </div>
                <div className="p-6 border border-black space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-widest">Vagus Nerve Process</h4>
                    <Checkbox className="border-black rounded-none data-[state=checked]:bg-black" />
                  </div>
                  <DocInput label="Notes" value={appointment.vagus_nerve_notes} field="vagus_nerve_notes" placeholder="Branch, function, reset..." />
                </div>
              </div>
            </div>
            <div className="mt-6">
              <DocInput label="Other SNS Techniques" value={appointment.additional_notes} field="additional_notes" placeholder="ESR, Vagus Nerve, etc..." multiline />
            </div>
          </section>

          {/* A - ALIGN */}
          <section>
            <SectionHeader id="a-sec" title="A — Align the Hierarchy" subtitle="Neurological Findings & Patterns" />
            
            <div className="space-y-16">
              <div>
                <SubHeader>Primitive Reflexes</SubHeader>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
                  {PRIMITIVE_REFLEXES.map(reflex => (
                    <div key={reflex.id} className="space-y-0.5">
                      {reflex.isLateralized ? (
                        <>
                          <CheckItem category="primitiveReflexes" name={reflex.name} side="L" />
                          <CheckItem category="primitiveReflexes" name={reflex.name} side="R" />
                        </>
                      ) : (
                        <CheckItem category="primitiveReflexes" name={reflex.name} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SubHeader>Cranial Nerves</SubHeader>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
                  {CRANIAL_NERVES.map(nerve => {
                    const name = `${nerve.name}: ${nerve.latinName}`;
                    return (
                      <div key={nerve.id} className="space-y-0.5">
                        {nerve.isLateralized ? (
                          <>
                            <CheckItem category="cranialNerves" name={name} side="L" />
                            <CheckItem category="cranialNerves" name={name} side="R" />
                          </>
                        ) : (
                          <CheckItem category="cranialNerves" name={name} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <SubHeader>Muscle Assessment</SubHeader>
                <div className="space-y-12">
                  {Object.entries(MUSCLE_GROUPS).map(([group, muscles]) => (
                    <div key={group} className="space-y-3">
                      <h4 className="text-[9px] font-black uppercase text-slate-400 border-l-2 border-slate-200 pl-2 tracking-widest">{group}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-0.5">
                        {muscles.map(muscle => (
                          <div key={muscle} className="space-y-0.5">
                            {MIDLINE_MUSCLES.includes(muscle) ? (
                              <CheckItem category="muscles" name={muscle} />
                            ) : (
                              <>
                                <CheckItem category="muscles" name={muscle} side="L" />
                                <CheckItem category="muscles" name={muscle} side="R" />
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* C - CORRECT */}
          <section>
            <SectionHeader id="c-sec" title="C — Correct" subtitle="Calibration & Integration" />
            
            <div className="p-8 border-2 border-black space-y-8 bg-white">
              <div className="flex items-center gap-3 border-b border-black pb-3">
                <Zap size={20} className="text-black" />
                <h3 className="text-sm font-black uppercase tracking-widest">Lofi Calibration Wizard</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Target & Direction */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target Finding</label>
                    <input 
                      type="text"
                      value={metadata.wizard_finding || ""}
                      onChange={(e) => updateMetadataField('wizard_finding', e.target.value)}
                      className="w-full bg-transparent border-b border-slate-200 py-1.5 text-sm font-bold focus:border-black outline-none transition-all"
                      placeholder="e.g. Left Psoas, Moro Reflex..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pathway Direction</label>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="dir-afferent"
                          checked={metadata.wizard_direction === 'Afferent'}
                          onCheckedChange={(checked) => updateMetadataField('wizard_direction', checked ? 'Afferent' : null)}
                          className="h-4 w-4 border-black rounded-none data-[state=checked]:bg-black"
                        />
                        <label htmlFor="dir-afferent" className="text-xs font-bold cursor-pointer">Afferent (Bottom-Up)</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="dir-efferent"
                          checked={metadata.wizard_direction === 'Efferent'}
                          onCheckedChange={(checked) => updateMetadataField('wizard_direction', checked ? 'Efferent' : null)}
                          className="h-4 w-4 border-black rounded-none data-[state=checked]:bg-black"
                        />
                        <label htmlFor="dir-efferent" className="text-xs font-bold cursor-pointer">Efferent (Top-Down)</label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Specific System</label>
                    {metadata.wizard_direction === 'Afferent' ? (
                      <div className="grid grid-cols-2 gap-2">
                        {['Mechanoreceptor', 'Vestibular/Ocular', 'Physiological', 'Nociceptive'].map(sys => (
                          <div key={sys} className="flex items-center gap-2">
                            <Checkbox 
                              id={`sys-${sys}`}
                              checked={metadata.wizard_system === sys}
                              onCheckedChange={(checked) => updateMetadataField('wizard_system', checked ? sys : null)}
                              className="h-4 w-4 border-black rounded-none data-[state=checked]:bg-black"
                            />
                            <label htmlFor={`sys-${sys}`} className="text-xs font-bold cursor-pointer">{sys}</label>
                          </div>
                        ))}
                      </div>
                    ) : metadata.wizard_direction === 'Efferent' ? (
                      <div className="grid grid-cols-2 gap-2">
                        {['Cortical', 'Subcortical', 'Emotional'].map(sys => (
                          <div key={sys} className="flex items-center gap-2">
                            <Checkbox 
                              id={`sys-${sys}`}
                              checked={metadata.wizard_system === sys}
                              onCheckedChange={(checked) => updateMetadataField('wizard_system', checked ? sys : null)}
                              className="h-4 w-4 border-black rounded-none data-[state=checked]:bg-black"
                            />
                            <label htmlFor={`sys-${sys}`} className="text-xs font-bold cursor-pointer">{sys}</label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Select a pathway direction first.</p>
                    )}
                  </div>
                </div>

                {/* Right Column: Coordinates & Polarity */}
                <div className="space-y-6">
                  <div className="space-y-4 border-l-2 border-slate-100 pl-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Calibration Coordinates</p>
                    
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase text-slate-400">Coordinate 1 (Zone Name)</label>
                      <select 
                        value={metadata.wizard_coord1_name || ""}
                        onChange={(e) => updateMetadataField('wizard_coord1_name', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-200 py-1.5 text-xs font-bold focus:border-black outline-none transition-all"
                      >
                        <option value="" className="text-slate-400">Select Zone...</option>
                        {brainZoneOptions.map(option => (
                          <option key={`c1-${option.id}`} value={option.name} className="text-black font-bold">
                            {option.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-4 pt-1">
                        {['Left', 'Right', 'Bilateral'].map(side => (
                          <div key={side} className="flex items-center gap-1.5">
                            <Checkbox 
                              id={`c1-side-${side}`}
                              checked={metadata.wizard_coord1_side === side}
                              onCheckedChange={(checked) => updateMetadataField('wizard_coord1_side', checked ? side : null)}
                              className="h-3.5 w-3.5 border-black rounded-none data-[state=checked]:bg-black"
                            />
                            <label htmlFor={`c1-side-${side}`} className="text-[10px] font-bold cursor-pointer">{side}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-[8px] font-black uppercase text-slate-400">Coordinate 2 (Zone Name)</label>
                      <select 
                        value={metadata.wizard_coord2_name || ""}
                        onChange={(e) => updateMetadataField('wizard_coord2_name', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-200 py-1.5 text-xs font-bold focus:border-black outline-none transition-all"
                      >
                        <option value="" className="text-slate-400">Select Zone...</option>
                        {brainZoneOptions.map(option => (
                          <option key={`c2-${option.id}`} value={option.name} className="text-black font-bold">
                            {option.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-4 pt-1">
                        {['Left', 'Right', 'Bilateral'].map(side => (
                          <div key={side} className="flex items-center gap-1.5">
                            <Checkbox 
                              id={`c2-side-${side}`}
                              checked={metadata.wizard_coord2_side === side}
                              onCheckedChange={(checked) => updateMetadataField('wizard_coord2_side', checked ? side : null)}
                              className="h-3.5 w-3.5 border-black rounded-none data-[state=checked]:bg-black"
                            />
                            <label htmlFor={`c2-side-${side}`} className="text-[10px] font-bold cursor-pointer">{side}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Polarity</label>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="pol-in"
                        checked={metadata.wizard_polarity === 'IN'}
                        onCheckedChange={(checked) => updateMetadataField('wizard_polarity', checked ? 'IN' : null)}
                        className="h-4 w-4 border-black rounded-none data-[state=checked]:bg-black"
                      />
                      <label htmlFor="pol-in" className="text-xs font-bold cursor-pointer">Energy IN (+)</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="pol-out"
                        checked={metadata.wizard_polarity === 'OUT'}
                        onCheckedChange={(checked) => updateMetadataField('wizard_polarity', checked ? 'OUT' : null)}
                        className="h-4 w-4 border-black rounded-none data-[state=checked]:bg-black"
                      />
                      <label htmlFor="pol-out" className="text-xs font-bold cursor-pointer">Energy OUT (-)</label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Correction Method</label>
                  <div className="flex flex-wrap gap-4">
                    {['Tapping', 'Holding + Intention', 'Tuning Fork'].map(method => (
                      <div key={method} className="flex items-center gap-2">
                        <Checkbox 
                          id={`method-${method}`}
                          checked={metadata.wizard_method === method}
                          onCheckedChange={(checked) => updateMetadataField('wizard_method', checked ? method : null)}
                          className="h-4 w-4 border-black rounded-none data-[state=checked]:bg-black"
                        />
                        <label htmlFor={`method-${method}`} className="text-xs font-bold cursor-pointer">{method}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <DocInput label="Acupoints Used" value={appointment.acupoints} field="acupoints" placeholder="e.g. GV20, KI27..." />
              </div>
            </div>

            {/* Detailed Correction Protocols Reference */}
            <div className="mt-8 p-8 border-2 border-black space-y-8 bg-white break-inside-avoid">
              <div className="flex items-center gap-3 border-b border-black pb-3">
                <BookOpen size={20} className="text-black" />
                <h3 className="text-sm font-black uppercase tracking-widest">Clinical Correction Protocols Reference</h3>
              </div>

              <div className="space-y-6 text-xs">
                {/* Afferent Protocols */}
                <div className="space-y-4">
                  <h4 className="font-black text-blue-600 uppercase tracking-wider text-[10px] border-b border-slate-100 pb-1">Afferent (Bottom-Up) Protocols</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-slate-900">1. Mechanoreceptor (Joint/Muscle)</p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-600 mt-1">
                        <li><strong>Conscious (DCML):</strong> Hold contralateral M1/S1 brain zones. Perform 30-40% isometric contraction in the restricted action. Hold for 30-90 seconds with nasal breathing.</li>
                        <li><strong>Unconscious (Spinocerebellar):</strong> Hold GV16 (Cerebellum). Stretch the priority ligament/tendon. Apply 128Hz tuning fork to cranium or tap for 3-5 seconds.</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">2. Vestibular / Ocular</p>
                      <p className="text-slate-600 mt-1">Place head into specific canal action (Anterior: Flexion, Posterior: Extension, Horizontal: Rotation, Utricle: Lateral Tilt). Maintain eye position (VOR, Smooth Pursuit, Saccades, Fixed Gaze). Hold GV16 (Cerebellum) + strike tuning fork on cranium or tap for 5-10 seconds.</p>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">3. Physiological</p>
                      <p className="text-slate-600 mt-1">Address biochemical or organ-specific reflexes. Check for nutritional or hydration priorities. Use specific neurolymphatic or neurovascular points. Consider meridian-based corrections.</p>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">4. Nociceptive</p>
                      <p className="text-slate-600 mt-1">Stimulate the threat (scar, old injury, movement). Test IM (should inhibit). Determine direction (Afferent vs Efferent). Apply correction (e.g., Mechanoreceptor, Cortical, etc.) with nasal breathing. Re-assess.</p>
                    </div>
                  </div>
                </div>

                {/* Efferent Protocols */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="font-black text-purple-600 uppercase tracking-wider text-[10px] border-b border-slate-100 pb-1">Efferent (Top-Down) Protocols</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-slate-900">1. Cortical</p>
                      <p className="text-slate-600 mt-1">Identify primary cortical zone (PFC, PMC, M1, S1, etc.) and lateralize (Contralateral logic). Identify secondary zone. Apply correction: Tapping (3-5s), Holding + Intention (until pulse), or Tuning Fork. Include pathway name during intention.</p>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">2. Subcortical</p>
                      <p className="text-slate-600 mt-1">Identify subcortical zone (Limbic, Cerebellum, Pons, Medulla, Hippocampus, Thalamus, Basal Ganglia, Hypothalamus, ACC). Lateralize response (Ipsilateral logic for Cerebellum/Pons/Medulla/Limbic). Use rhythmic movements or breathing patterns. Apply correction method: Tapping, Holding + Intention, or Tuning Fork.</p>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">3. Emotional (Neuro-Emotional Integration)</p>
                      <p className="text-slate-600 mt-1">Standard 9-Step Neuro-Emotional Integration (NEI). Hold Frontal Lobe (ESR) + Pulse Point + Eye Position. Replay stress until shift (sigh, yawn, gurgle), then upload positive state.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* E - EMBED */}
          <section>
            <SectionHeader id="e2-sec" title="E — Embed" subtitle="Re-Assessment & Homework" />
            <div className="space-y-10">
              <DocInput label="Final Re-Assessment & Prescribed Homework" value={appointment.session_north_star} field="session_north_star" placeholder="Verify integration and define the client's daily practice..." multiline />
              <DocInput label="General Session Notes" value={appointment.notes} field="notes" placeholder="Any additional observations or context..." multiline />
              <DocInput label="Practitioner Reflection (Private)" value={appointment.journal} field="journal" placeholder="Personal insights for the Sandbox..." multiline />
            </div>
          </section>

          {/* Footer */}
          <div className="pt-32 border-t-2 border-black text-center space-y-4">
            <div className="flex justify-center gap-12 text-[10px] font-black uppercase tracking-[0.3em]">
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-black" /> Verified</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-black" /> Integrated</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-black" /> Encrypted</div>
            </div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.5em]">Fractal Resolution OS • Resonance Clinical Infrastructure</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          textarea {
            border: none !important;
            padding: 0 !important;
            background: transparent !important;
          }
          input {
            border-bottom: 1px solid #eee !important;
          }
          .scroll-mt-24 {
            scroll-margin-top: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SessionDocumentView;