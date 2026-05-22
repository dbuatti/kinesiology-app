"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { format, isToday, isTomorrow, differenceInSeconds, parseISO } from 'date-fns';
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
  BookOpen,
  Calendar,
  X,
  Maximize2,
  Minimize2
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
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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

const TIMER_PRESETS = [
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '3m', value: 180 },
  { label: '6m', value: 360 },
  { label: '9m', value: 540 },
];

const SessionDocumentView = ({ 
  appointment, 
  onUpdate, 
  saveField, 
  updatePriorityPattern,
  onClose
}: SessionDocumentViewProps) => {
  const navigate = useNavigate();
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [openGuides, setOpenGuides] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<string>("p-sec");
  const [currentMuscleTests, setCurrentMuscleTests] = useState<any[]>([]);
  const [loadingMuscles, setLoadingMuscles] = useState(true);
  
  // Live Clock & Progress State
  const [currentTime, setCurrentTime] = useState(new Date());

  // Full Screen State
  const [isFullScreen, setIsFullScreen] = useState(() => {
    return localStorage.getItem('antigravity_fullscreen') === 'true';
  });

  // Quick Timer State
  const [activeTimerDuration, setActiveTimerDuration] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const quickTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Navigation Dropdown State
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

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

  const fetchAllAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          status,
          tag,
          clients (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setAllAppointments(data || []);
    } catch (err) {
      console.error("Error fetching appointments for switcher:", err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    fetchCurrentMuscleTests();
    fetchAllAppointments();
  }, [appointment.id]);

  // Live Clock & Timer Effect
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleFullScreenChange = () => {
      setIsFullScreen(localStorage.getItem('antigravity_fullscreen') === 'true');
    };

    window.addEventListener('antigravity_fullscreen_change', handleFullScreenChange);

    return () => {
      clearInterval(clockTimer);
      window.removeEventListener('antigravity_fullscreen_change', handleFullScreenChange);
      if (quickTimerRef.current) clearInterval(quickTimerRef.current);
    };
  }, []);

  const toggleFullScreen = () => {
    const nextState = !isFullScreen;
    setIsFullScreen(nextState);
    localStorage.setItem('antigravity_fullscreen', String(nextState));
    window.dispatchEvent(new Event('antigravity_fullscreen_change'));
    showSuccess(nextState ? "Full Screen Enabled" : "Full Screen Disabled");
  };

  const startQuickTimer = (duration: number) => {
    if (quickTimerRef.current) clearInterval(quickTimerRef.current);
    setActiveTimerDuration(duration);
    setTimeLeft(duration);
    
    quickTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(quickTimerRef.current!);
          setActiveTimerDuration(null);
          showSuccess("Timer complete!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopQuickTimer = () => {
    if (quickTimerRef.current) clearInterval(quickTimerRef.current);
    setActiveTimerDuration(null);
    setTimeLeft(0);
  };

  const formatCountdown = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const overallProgressPercent = useMemo(() => {
    const elapsedSeconds = differenceInSeconds(currentTime, new Date(appointment.date));
    const totalDurationSeconds = 60 * 60; // 60 minutes
    return Math.min(100, Math.max(0, (elapsedSeconds / totalDurationSeconds) * 100));
  }, [appointment.date, currentTime]);

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

  // Set up real-time scroll listener to track active section on scroll
  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollContainerRect = scrollContainer.getBoundingClientRect();
      const threshold = scrollContainerRect.top + 120; // 120px offset from top of container

      let active = OUTLINE_ITEMS[0].id;

      for (const item of OUTLINE_ITEMS) {
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold) {
            active = item.id;
          } else {
            break; // Stop once we find a section below the threshold
          }
        }
      }
      setActiveSection(active);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    // Run once initially to set correct active section
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
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
      combined.muscles[test.muscle_name] = test.status; // Keep exact status: 'Normotonic', 'Inhibition', 'Hypertonic', etc.
    });
    
    return combined;
  }, [pattern, currentMuscleTests]);

  // Extract all currently inhibited findings from the unified pattern
  const inhibitedFindings = useMemo(() => {
    const list: string[] = [];
    Object.entries(unifiedPattern).forEach(([category, items]: [string, any]) => {
      Object.entries(items).forEach(([name, status]) => {
        if (status === 'Inhibited' || status === 'Inhibition' || status === 'Hypertonic') {
          list.push(name);
        }
      });
    });
    return list.sort();
  }, [unifiedPattern]);

  const handleTogglePatternItem = (category: string, name: string, nextStatus: string, side?: 'L' | 'R') => {
    const fullName = side ? `${name} (${side})` : name;

    if (category === 'muscles') {
      const dbStatus = nextStatus === 'Clear' ? 'Normotonic' : nextStatus === 'Inhibited' ? 'Inhibition' : 'Hypertonic';
      const existing = currentMuscleTests.find(t => t.muscle_name === fullName);
      
      const runUpdate = async () => {
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
          showSuccess(`${fullName} marked as ${nextStatus}`);
        } catch (err) {
          showError("Failed to update muscle status");
        }
        setLastSaved(new Date());
        onUpdate();
      };
      runUpdate();
    } else {
      const runUpdatePattern = async () => {
        await updatePriorityPattern(category, name, nextStatus === 'Clear' ? 'Clear' : 'Inhibited', side);
        setLastSaved(new Date());
        onUpdate();
      };
      runUpdatePattern();
    }
  };

  // Group appointments for the dropdown switcher
  const groupedAppointments = useMemo(() => {
    const todayList: any[] = [];
    const upcomingList: any[] = [];
    const pastList: any[] = [];

    allAppointments.forEach(app => {
      const appDate = new Date(app.date);
      if (isToday(appDate)) {
        todayList.push(app);
      } else if (appDate > new Date()) {
        upcomingList.push(app);
      } else {
        pastList.push(app);
      }
    });

    return {
      today: todayList,
      upcoming: upcomingList,
      past: pastList.reverse().slice(0, 10) // Show last 10 past sessions
    };
  }, [allAppointments]);

  const handleSwitchAppointment = (newId: string) => {
    navigate(`/appointments/${newId}?view=document`);
  };

  return (
    <div className="bg-white min-h-screen text-black font-sans pb-40 print:p-0 print:m-0">
      {/* Document Controls */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md print:hidden">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-none h-9 px-4 font-black text-[10px] uppercase tracking-widest border border-black hover:bg-black hover:text-white transition-all">
              <ArrowLeft size={14} className="mr-2" /> Exit
            </Button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Record</span>
              
              {/* Live Client Switcher Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 hover:bg-slate-100 px-2 py-0.5 -ml-2 rounded-lg transition-colors text-left group">
                    <span className="text-sm font-black text-slate-900">{appointment.clients.name}</span>
                    <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80 max-h-[450px] overflow-y-auto rounded-2xl p-2 shadow-3xl border-none bg-white dark:bg-slate-900 z-[100]">
                  {loadingAppointments ? (
                    <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={20} /></div>
                  ) : (
                    <>
                      {groupedAppointments.today.length > 0 && (
                        <div className="space-y-1">
                          <div className="px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Today's Schedule
                          </div>
                          {groupedAppointments.today.map(app => (
                            <DropdownMenuItem 
                              key={app.id} 
                              onClick={() => handleSwitchAppointment(app.id)}
                              className={cn(
                                "rounded-xl py-2.5 px-4 cursor-pointer flex items-center justify-between",
                                app.id === appointment.id ? "bg-indigo-50 text-indigo-900 font-bold" : "hover:bg-slate-50"
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-black truncate">{app.clients?.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                  {format(new Date(app.date), "h:mm a")} • {app.tag}
                                </p>
                              </div>
                              <Badge className={cn(
                                "border-none font-black text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                                app.status === 'Completed' ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white"
                              )}>
                                {app.status}
                              </Badge>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      )}

                      {groupedAppointments.upcoming.length > 0 && (
                        <div className="space-y-1 mt-3">
                          <div className="px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <Calendar size={10} /> Upcoming Sessions
                          </div>
                          {groupedAppointments.upcoming.slice(0, 10).map(app => (
                            <DropdownMenuItem 
                              key={app.id} 
                              onClick={() => handleSwitchAppointment(app.id)}
                              className={cn(
                                "rounded-xl py-2.5 px-4 cursor-pointer flex items-center justify-between",
                                app.id === appointment.id ? "bg-indigo-50 text-indigo-900 font-bold" : "hover:bg-slate-50"
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-black truncate">{app.clients?.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                  {format(new Date(app.date), "MMM d, h:mm a")} • {app.tag}
                                </p>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      )}

                      {groupedAppointments.past.length > 0 && (
                        <div className="space-y-1 mt-3">
                          <div className="px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <Clock size={10} /> Recent Past Sessions
                          </div>
                          {groupedAppointments.past.map(app => (
                            <DropdownMenuItem 
                              key={app.id} 
                              onClick={() => handleSwitchAppointment(app.id)}
                              className={cn(
                                "rounded-xl py-2.5 px-4 cursor-pointer flex items-center justify-between",
                                app.id === appointment.id ? "bg-indigo-50 text-indigo-900 font-bold" : "hover:bg-slate-50"
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-black truncate">{app.clients?.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                  {format(new Date(app.date), "MMM d, yyyy")} • {app.tag}
                                </p>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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

          <div className="flex items-center gap-6">
            {/* Quick Timers Panel */}
            <div className="flex items-center gap-1.5 border-r border-slate-200 pr-4">
              {TIMER_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => startQuickTimer(preset.value)}
                  className={cn(
                    "w-8 h-8 rounded-full border text-[9px] font-black flex items-center justify-center transition-all",
                    activeTimerDuration === preset.value
                      ? "bg-indigo-600 border-indigo-600 text-white animate-pulse"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600"
                  )}
                >
                  {activeTimerDuration === preset.value ? formatCountdown(timeLeft) : preset.label}
                </button>
              ))}
              {activeTimerDuration && (
                <button 
                  onClick={stopQuickTimer} 
                  className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Full Screen Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullScreen}
              className="h-9 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest gap-1.5 text-slate-500 hover:bg-slate-100"
              title="Toggle Full Screen (Alt + F)"
            >
              {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isFullScreen ? "Exit Full" : "Full Screen"}</span>
            </Button>

            {/* Live Current Time Display */}
            <div className="text-right hidden sm:block">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Current Time</p>
              <p className="text-sm font-black tabular-nums text-indigo-600">{format(currentTime, "HH:mm:ss")}</p>
            </div>

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

        {/* Rainbow Progress Bar */}
        <div className="h-[3px] w-full bg-slate-100 relative overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 via-pink-500 via-rose-500 via-amber-500 to-emerald-500 transition-all duration-1000 ease-linear"
            style={{ width: `${overallProgressPercent}%` }}
          />
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