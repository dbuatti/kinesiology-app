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
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from '@/utils/toast';

// Modular Sub-components
import DocumentSidebar, { OUTLINE_ITEMS } from './document-view/DocumentSidebar';
import DocumentHeader from './document-view/DocumentHeader';
import PreliminarySection from './document-view/PreliminarySection';
import EaseSection from './document-view/EaseSection';
import AlignSection from './document-view/AlignSection';
import CorrectSection from './document-view/CorrectSection';
import EmbedSection from './document-view/EmbedSection';

interface SessionDocumentViewProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
  onClose: () => void;
}

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
  const [currentMuscleTests, setCurrentMuscleTests] = useState<any[]>([]);
  const [loadingMuscles, setLoadingMuscles] = useState(true);

  const pattern = useMemo(() => safeParse(appointment.priority_pattern, {} as any), [appointment.priority_pattern]);

  const fetchCurrentMuscleTests = async () => {
    if (!appointment.id || appointment.id.includes('00000000')) {
      setLoadingMuscles(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('muscle_tests')
        .select('*')
        .eq('appointment_id', appointment.id);
      if (!error && data) {
        setCurrentMuscleTests(data);
      }
    } catch (err) {
      console.error("Error fetching current muscle tests:", err);
    } finally {
      setLoadingMuscles(false);
    }
  };

  useEffect(() => {
    fetchCurrentMuscleTests();
  }, [appointment.id]);

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

  // Get sorted list of brain zone names for the dropdowns (excluding Cranial Nerves)
  const brainZoneOptions = useMemo(() => {
    return BRAIN_REFLEX_POINTS
      .filter(p => p.category === 'Cortical' || p.category === 'Subcortical')
      .map(p => {
        const displayName = p.name.includes(':') ? p.name.split(':')[0].trim() : p.name;
        return { id: p.id, name: displayName, category: p.category };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Create a unified pattern that merges priority_pattern JSON and muscle_tests table
  const unifiedPattern = useMemo(() => {
    const combined = { ...pattern };
    if (!combined.muscles) combined.muscles = {};
    
    currentMuscleTests.forEach(test => {
      combined.muscles[test.muscle_name] = test.status === 'Normotonic' ? 'Clear' : 'Inhibited';
    });
    
    return combined;
  }, [pattern, currentMuscleTests]);

  // Extract all currently inhibited findings from the unified pattern
  const inhibitedFindings = useMemo(() => {
    const list: string[] = [];
    Object.entries(unifiedPattern).forEach(([category, items]: [string, any]) => {
      Object.entries(items).forEach(([name, status]) => {
        if (status === 'Inhibited') {
          list.push(name);
        }
      });
    });
    return list.sort();
  }, [unifiedPattern]);

  const handleTogglePatternItem = async (category: string, name: string, isChecked: boolean, side?: 'L' | 'R') => {
    const fullName = side ? `${name} (${side})` : name;
    const newStatus = isChecked ? 'Clear' : 'Inhibited';

    if (category === 'muscles') {
      const dbStatus = isChecked ? 'Normotonic' : 'Inhibited';
      const existing = currentMuscleTests.find(t => t.muscle_name === fullName);
      
      try {
        if (existing) {
          const { error } = await supabase
            .from('muscle_tests')
            .update({ status: dbStatus })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          const { error } = await supabase
            .from('muscle_tests')
            .insert({
              user_id: user?.id,
              appointment_id: appointment.id,
              muscle_name: fullName,
              status: dbStatus
            });
          if (error) throw error;
        }
        await fetchCurrentMuscleTests();
        showSuccess(`${fullName} marked as ${isChecked ? 'Clear' : 'Inhibited'}`);
      } catch (err) {
        showError("Failed to update muscle status");
      }
    } else {
      await updatePriorityPattern(category, name, newStatus, side);
    }
    setLastSaved(new Date());
    onUpdate();
  };

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
      <div className="w-full px-6 flex gap-12 items-start justify-start pt-8 print:block print:p-0">
        
        {/* Left Sidebar: Outline & Corrections Guide */}
        <DocumentSidebar 
          activeSection={activeSection} 
          scrollTo={scrollTo} 
          openGuides={openGuides} 
          toggleGuide={toggleGuide} 
        />

        {/* Right Side: The Document */}
        <div className="flex-1 max-w-[850px] bg-white border-none md:border md:border-slate-200 md:shadow-sm p-6 sm:p-10 md:p-16 min-h-[1056px] print:border-none print:p-0">
          {/* Header */}
          <DocumentHeader 
            clientName={appointment.clients.name} 
            date={appointment.date} 
            displayId={appointment.display_id} 
            id={appointment.id} 
          />

          {/* P - PRELIMINARY */}
          <section>
            <SectionHeader id="p-sec" title="P — Preliminary Assessment" subtitle="Intake & Baseline Vitals" />
            <PreliminarySection appointment={appointment} saveField={saveField} />
          </section>

          {/* E - EASE */}
          <section>
            <SectionHeader id="e-sec" title="E — Ease the System" subtitle="SNS Down-Regulation" />
            <EaseSection appointment={appointment} saveField={saveField} />
          </section>

          {/* A - ALIGN */}
          <section>
            <SectionHeader id="a-sec" title="A — Align the Hierarchy" subtitle="Neurological Findings & Patterns" />
            <AlignSection pattern={unifiedPattern} onToggle={handleTogglePatternItem} />
          </section>

          {/* C - CORRECT */}
          <section>
            <SectionHeader id="c-sec" title="C — Correct" subtitle="Calibration & Integration" />
            <CorrectSection 
              metadata={metadata} 
              acupoints={appointment.acupoints} 
              brainZoneOptions={brainZoneOptions} 
              inhibitedFindings={inhibitedFindings}
              updateMetadataField={updateMetadataField} 
              saveField={saveField} 
            />
          </section>

          {/* E - EMBED */}
          <section>
            <SectionHeader id="e2-sec" title="E — Embed" subtitle="Re-Assessment & Homework" />
            <EmbedSection appointment={appointment} saveField={saveField} />
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
    </div>
  );
};

export default SessionDocumentView;